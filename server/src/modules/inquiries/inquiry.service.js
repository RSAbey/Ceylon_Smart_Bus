// Inquiry business logic (Member 03, FR-08): passengers and drivers raise questions and complaints,
// admins reply. Editing and deleting are only allowed in the first few minutes, enforced here on the
// server so the rule cannot be bypassed by calling the API directly.
const Inquiry = require('./inquiry.model');
const InquiryReply = require('./inquiryReply.model');
const User = require('../users/user.model');
const notificationService = require('../notifications/notification.service');
const {
  INQUIRY_STATUSES,
  INQUIRY_PRIORITIES,
  INQUIRY_EDIT_WINDOW_MINUTES,
  INQUIRY_REPLY_TARGET_HOURS,
} = require('./inquiry.constants');
const { USER_ROLES } = require('../users/user.constants');
const { NOTIFICATION_TYPES } = require('../notifications/notification.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

const MILLISECONDS_PER_MINUTE = 60 * 1000;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
/** The value the inbox sends to ask for inquiries nobody has picked up. */
const UNASSIGNED_FILTER = 'unassigned';

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
 * How long an inquiry has been waiting, and whether that is longer than the team's reply target.
 * Only an unanswered inquiry can be late: once it has a reply the clock has served its purpose.
 * @param {object} inquiry - The inquiry to measure.
 * @param {number} replyCount - How many replies it already has.
 * @returns {{waitingHours: number, isWaitingTooLong: boolean}} Age in whole hours and the flag.
 */
function measureWait(inquiry, replyCount) {
  const waitingHours = Math.floor(
    (Date.now() - new Date(inquiry.createdAt).getTime()) / MILLISECONDS_PER_HOUR
  );
  return {
    waitingHours,
    isWaitingTooLong:
      replyCount === 0 &&
      inquiry.status === INQUIRY_STATUSES.OPEN &&
      waitingHours >= INQUIRY_REPLY_TARGET_HOURS,
  };
}

/**
 * The admin inbox: every inquiry with who raised it and who is dealing with it, narrowed by status,
 * tag, priority, assignee or a text search (FR-08). The counts above the table are returned with it,
 * so the chips keep showing the whole picture while the table is filtered.
 * @param {object} [inboxFilters] - Optional status, tag, priority, assigneeId and search filters.
 * @returns {Promise<object>} Inquiries newest first, with the inbox counts.
 */
async function listAllInquiries(inboxFilters = {}) {
  const inquiryFilter = {};
  ['status', 'tag', 'priority'].forEach((filterName) => {
    if (inboxFilters[filterName]) inquiryFilter[filterName] = inboxFilters[filterName];
  });
  // "unassigned" is a queue an admin works from, so it is offered as an assignee like any other.
  if (inboxFilters.assigneeId === UNASSIGNED_FILTER) {
    inquiryFilter.assigneeId = { $exists: false };
  } else if (inboxFilters.assigneeId) {
    inquiryFilter.assigneeId = inboxFilters.assigneeId;
  }
  if (inboxFilters.searchText) {
    // Escape the input so somebody typing "." or "*" cannot build their own regular expression.
    const safeSearchText = inboxFilters.searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchPattern = new RegExp(safeSearchText, 'i');
    inquiryFilter.$or = [{ subject: searchPattern }, { message: searchPattern }];
  }

  const inquiries = await Inquiry.find(inquiryFilter)
    .sort({ createdAt: -1 })
    .populate('userId', 'fullName email role')
    .populate('assigneeId', 'fullName')
    .populate('routeId', 'routeNumber');

  const inboxRows = await Promise.all(
    inquiries.map(async (inquiry) => {
      const replyCount = await InquiryReply.countDocuments({ inquiryId: inquiry.id });
      return { inquiry, replyCount, ...measureWait(inquiry, replyCount) };
    })
  );

  const [openCount, repliedCount, closedCount, highPriorityOpenCount, unassignedOpenCount] =
    await Promise.all([
      Inquiry.countDocuments({ status: INQUIRY_STATUSES.OPEN }),
      Inquiry.countDocuments({ status: INQUIRY_STATUSES.REPLIED }),
      Inquiry.countDocuments({ status: INQUIRY_STATUSES.CLOSED }),
      Inquiry.countDocuments({
        status: INQUIRY_STATUSES.OPEN,
        priority: INQUIRY_PRIORITIES.HIGH,
      }),
      Inquiry.countDocuments({
        status: INQUIRY_STATUSES.OPEN,
        assigneeId: { $exists: false },
      }),
    ]);

  return {
    inquiries: inboxRows,
    statusCounts: {
      open: openCount,
      replied: repliedCount,
      closed: closedCount,
      total: openCount + repliedCount + closedCount,
    },
    highPriorityOpenCount,
    unassignedOpenCount,
    replyTargetHours: INQUIRY_REPLY_TARGET_HOURS,
  };
}

/**
 * One inquiry with its replies, for the admin detail panel.
 * @param {string} inquiryId - Inquiry to open.
 * @returns {Promise<object>} The inquiry and its replies.
 */
async function getInquiryForAdmin(inquiryId) {
  const matchingInquiry = await Inquiry.findById(inquiryId)
    .populate('userId', 'fullName email role')
    .populate('assigneeId', 'fullName')
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

/**
 * Reopens a closed inquiry, which is the only way back: replying to a closed one is refused, so
 * without this a passenger who writes again could never be answered on the same thread.
 * @param {string} inquiryId - Inquiry to reopen.
 * @returns {Promise<object>} The reopened inquiry.
 */
async function reopenInquiry(inquiryId) {
  const reopenableInquiry = await Inquiry.findById(inquiryId);
  if (!reopenableInquiry) {
    throw new AppError('Inquiry not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (reopenableInquiry.status !== INQUIRY_STATUSES.CLOSED) {
    throw new AppError('This inquiry is already open.', HTTP_STATUS.CONFLICT);
  }
  reopenableInquiry.status = INQUIRY_STATUSES.OPEN;
  reopenableInquiry.closedAt = undefined;
  await reopenableInquiry.save();
  return reopenableInquiry;
}

/**
 * Hands an inquiry to an administrator, or puts it back in the unassigned queue.
 * @param {string} inquiryId - Inquiry to hand over.
 * @param {string | null} assigneeUserId - The admin taking it, or null to unassign.
 * @returns {Promise<object>} The inquiry with its assignee filled in.
 */
async function assignInquiry(inquiryId, assigneeUserId) {
  const assignableInquiry = await Inquiry.findById(inquiryId);
  if (!assignableInquiry) {
    throw new AppError('Inquiry not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (assigneeUserId) {
    // Only an administrator can own an inquiry: a passenger id here would hide it from the team.
    const assignee = await User.findById(assigneeUserId).select('role');
    if (!assignee || assignee.role !== USER_ROLES.ADMIN) {
      throw new AppError('Choose an administrator to assign this to.', HTTP_STATUS.UNPROCESSABLE_ENTITY, [
        { field: 'assigneeId', message: 'That account is not an administrator.' },
      ]);
    }
    assignableInquiry.assigneeId = assigneeUserId;
  } else {
    assignableInquiry.assigneeId = undefined;
  }

  await assignableInquiry.save();
  return assignableInquiry.populate('assigneeId', 'fullName');
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
  reopenInquiry,
  assignInquiry,
};
