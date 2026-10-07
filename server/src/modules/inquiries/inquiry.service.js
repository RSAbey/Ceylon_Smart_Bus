// Inquiry business logic (Member 03, FR-08): passengers and drivers raise questions and complaints,
// admins reply. Editing and deleting are only allowed in the first few minutes, enforced here on the
// server so the rule cannot be bypassed by calling the API directly.
const Inquiry = require('./inquiry.model');
const InquiryReply = require('./inquiryReply.model');
const notificationService = require('../notifications/notification.service');
const { INQUIRY_STATUSES, INQUIRY_EDIT_WINDOW_MINUTES } = require('./inquiry.constants');
const { NOTIFICATION_TYPES } = require('../notifications/notification.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

const MILLISECONDS_PER_MINUTE = 60 * 1000;

/**
 * Whether an inquiry is still inside its edit window.
 * @param {object} inquiry - The inquiry to check.
 * @returns {boolean} True while the author may still change or delete it.
 */
function isWithinEditWindow(inquiry) {
  const windowEndsAt =
    inquiry.createdAt.getTime() + INQUIRY_EDIT_WINDOW_MINUTES * MILLISECONDS_PER_MINUTE;
  return Date.now() <= windowEndsAt;
}

/**
 * Loads the author's own inquiry, refusing to touch anyone else's.
 * @param {string} userId - Signed-in passenger or driver.
 * @param {string} inquiryId - Inquiry to load.
 * @returns {Promise<object>} The inquiry document.
 */
async function getOwnInquiry(userId, inquiryId) {
  const matchingInquiry = await Inquiry.findById(inquiryId);
  if (!matchingInquiry) {
    throw new AppError('Inquiry not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (String(matchingInquiry.userId) !== String(userId)) {
    throw new AppError('You can only open your own inquiries.', HTTP_STATUS.FORBIDDEN);
  }
  return matchingInquiry;
}

/**
 * Raises a new inquiry.
 * @param {string} userId - Signed-in passenger or driver.
 * @param {object} inquiryDetails - Subject, message, tag, priority and optional links.
 * @returns {Promise<object>} The stored inquiry.
 */
async function createInquiry(userId, inquiryDetails) {
  return Inquiry.create({
    userId,
    subject: inquiryDetails.subject.trim(),
    message: inquiryDetails.message.trim(),
    tag: inquiryDetails.tag,
    priority: inquiryDetails.priority,
    routeId: inquiryDetails.routeId,
    busId: inquiryDetails.busId,
    driverId: inquiryDetails.driverId,
  });
}

/**
 * The author's own inquiries, newest first, each with its reply count and whether it can still be edited.
 * @param {string} userId - Signed-in passenger or driver.
 * @param {string} [status] - One of INQUIRY_STATUSES.
 * @returns {Promise<object[]>} Inquiries for the list screen.
 */
async function listMyInquiries(userId, status) {
  const inquiryFilter = { userId };
  if (status) inquiryFilter.status = status;
  const inquiries = await Inquiry.find(inquiryFilter).sort({ createdAt: -1 });

  return Promise.all(
    inquiries.map(async (inquiry) => ({
      inquiry,
      replyCount: await InquiryReply.countDocuments({ inquiryId: inquiry.id }),
      isEditable: inquiry.status === INQUIRY_STATUSES.OPEN && isWithinEditWindow(inquiry),
    }))
  );
}

/**
 * One inquiry with the admin replies underneath it.
 * @param {string} userId - Signed-in passenger or driver.
 * @param {string} inquiryId - Inquiry to open.
 * @returns {Promise<object>} The inquiry, its replies and whether it can still be edited.
 */
async function getInquiryDetails(userId, inquiryId) {
  const matchingInquiry = await getOwnInquiry(userId, inquiryId);
  const replies = await InquiryReply.find({ inquiryId }).sort({ createdAt: 1 });
  return {
    inquiry: matchingInquiry,
    replies,
    isEditable: matchingInquiry.status === INQUIRY_STATUSES.OPEN && isWithinEditWindow(matchingInquiry),
    editWindowMinutes: INQUIRY_EDIT_WINDOW_MINUTES,
  };
}

/**
 * Changes an inquiry the author raised minutes ago. Once an admin has replied or the window has
 * passed the text is frozen, so the conversation cannot be rewritten underneath the reply.
 * @param {string} userId - Signed-in passenger or driver.
 * @param {string} inquiryId - Inquiry to change.
 * @param {object} inquiryChanges - Any of subject, message, tag, priority.
 * @returns {Promise<object>} The updated inquiry.
 */
async function updateInquiry(userId, inquiryId, inquiryChanges) {
  const editableInquiry = await getOwnInquiry(userId, inquiryId);
  if (editableInquiry.status !== INQUIRY_STATUSES.OPEN) {
    throw new AppError(
      `This inquiry is ${editableInquiry.status} and can no longer be edited.`,
      HTTP_STATUS.CONFLICT
    );
  }
  if (!isWithinEditWindow(editableInquiry)) {
    throw new AppError(
      `Inquiries can only be edited within ${INQUIRY_EDIT_WINDOW_MINUTES} minutes of sending them.`,
      HTTP_STATUS.CONFLICT
    );
  }

  ['subject', 'message'].forEach((fieldName) => {
    if (inquiryChanges[fieldName] !== undefined) {
      editableInquiry[fieldName] = inquiryChanges[fieldName].trim();
    }
  });
  if (inquiryChanges.tag !== undefined) editableInquiry.tag = inquiryChanges.tag;
  if (inquiryChanges.priority !== undefined) editableInquiry.priority = inquiryChanges.priority;
  await editableInquiry.save();

  return editableInquiry;
}

/**
 * Deletes an inquiry inside the same short window, with its replies.
 * @param {string} userId - Signed-in passenger or driver.
 * @param {string} inquiryId - Inquiry to delete.
 * @returns {Promise<void>} Resolves once removed.
 */
async function deleteInquiry(userId, inquiryId) {
  const deletableInquiry = await getOwnInquiry(userId, inquiryId);
  if (deletableInquiry.status !== INQUIRY_STATUSES.OPEN) {
    throw new AppError(
      `This inquiry is ${deletableInquiry.status} and can no longer be deleted.`,
      HTTP_STATUS.CONFLICT
    );
  }
  if (!isWithinEditWindow(deletableInquiry)) {
    throw new AppError(
      `Inquiries can only be deleted within ${INQUIRY_EDIT_WINDOW_MINUTES} minutes of sending them.`,
      HTTP_STATUS.CONFLICT
    );
  }
  await InquiryReply.deleteMany({ inquiryId });
  await Inquiry.findByIdAndDelete(inquiryId);
}

/**
 * The admin inbox: every inquiry with who raised it, filtered by status, tag or priority (FR-08).
 * @param {object} [inboxFilters] - Optional status, tag and priority filters.
 * @returns {Promise<object[]>} Inquiries newest first, each with its author and reply count.
 */
async function listAllInquiries(inboxFilters = {}) {
  const inquiryFilter = {};
  ['status', 'tag', 'priority'].forEach((filterName) => {
    if (inboxFilters[filterName]) inquiryFilter[filterName] = inboxFilters[filterName];
  });

  const inquiries = await Inquiry.find(inquiryFilter)
    .sort({ createdAt: -1 })
    .populate('userId', 'fullName email role')
    .populate('routeId', 'routeNumber');

  return Promise.all(
    inquiries.map(async (inquiry) => ({
      inquiry,
      replyCount: await InquiryReply.countDocuments({ inquiryId: inquiry.id }),
    }))
  );
}

/**
 * One inquiry with its replies, for the admin detail panel.
 * @param {string} inquiryId - Inquiry to open.
 * @returns {Promise<object>} The inquiry and its replies.
 */
async function getInquiryForAdmin(inquiryId) {
  const matchingInquiry = await Inquiry.findById(inquiryId)
    .populate('userId', 'fullName email role')
    .populate('routeId', 'routeNumber');
  if (!matchingInquiry) {
    throw new AppError('Inquiry not found.', HTTP_STATUS.NOT_FOUND);
  }
  const replies = await InquiryReply.find({ inquiryId })
    .sort({ createdAt: 1 })
    .populate('adminId', 'fullName');
  return { inquiry: matchingInquiry, replies };
}

/**
 * Posts an admin reply and notifies the author, which is what makes the reply visible in the app.
 * @param {string} adminUserId - Signed-in admin.
 * @param {string} inquiryId - Inquiry being answered.
 * @param {string} message - Reply text.
 * @returns {Promise<object>} The stored reply.
 */
async function replyToInquiry(adminUserId, inquiryId, message) {
  const answerableInquiry = await Inquiry.findById(inquiryId);
  if (!answerableInquiry) {
    throw new AppError('Inquiry not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (answerableInquiry.status === INQUIRY_STATUSES.CLOSED) {
    throw new AppError('This inquiry is closed. Reopen it before replying.', HTTP_STATUS.CONFLICT);
  }

  const storedReply = await InquiryReply.create({
    inquiryId,
    adminId: adminUserId,
    message: message.trim(),
  });

  answerableInquiry.status = INQUIRY_STATUSES.REPLIED;
  await answerableInquiry.save();

  await notificationService.createNotification({
    recipientUserIds: [String(answerableInquiry.userId)],
    type: NOTIFICATION_TYPES.INQUIRY_REPLY,
    title: 'Support replied to your inquiry',
    message: `We have answered "${answerableInquiry.subject}". Open it to read the reply.`,
    related: { routeId: answerableInquiry.routeId },
  });

  return storedReply;
}

/**
 * Closes an inquiry once it is dealt with.
 * @param {string} inquiryId - Inquiry to close.
 * @returns {Promise<object>} The closed inquiry.
 */
async function closeInquiry(inquiryId) {
  const closableInquiry = await Inquiry.findById(inquiryId);
  if (!closableInquiry) {
    throw new AppError('Inquiry not found.', HTTP_STATUS.NOT_FOUND);
  }
  closableInquiry.status = INQUIRY_STATUSES.CLOSED;
  closableInquiry.closedAt = new Date();
  await closableInquiry.save();
  return closableInquiry;
}

module.exports = {
  createInquiry,
  listMyInquiries,
  getInquiryDetails,
  updateInquiry,
  deleteInquiry,
  listAllInquiries,
  getInquiryForAdmin,
  replyToInquiry,
  closeInquiry,
};
