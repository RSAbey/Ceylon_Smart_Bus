// What the signed-in administrator has done (Member 01, FR-10). Every figure is counted from rows
// that already name them, so the profile screen reports real work rather than a decorative total.
const Announcement = require('../announcements/announcement.model');
const Inquiry = require('../inquiries/inquiry.model');
const InquiryReply = require('../inquiries/inquiryReply.model');
const { ANNOUNCEMENT_STATUSES } = require('../announcements/announcement.constants');
const { INQUIRY_STATUSES } = require('../inquiries/inquiry.constants');

/**
 * The three figures on the administrator's own profile page.
 * @param {string} adminUserId - Signed-in administrator.
 * @returns {Promise<object>} Notifications sent, replies written and inquiries still assigned.
 */
async function getAdminActivity(adminUserId) {
  const [notificationsSent, repliesWritten, assignedInquiryCount] = await Promise.all([
    Announcement.countDocuments({
      adminId: adminUserId,
      status: ANNOUNCEMENT_STATUSES.PUBLISHED,
    }),
    InquiryReply.countDocuments({ adminId: adminUserId }),
    // Still on their desk: assigned to them and not yet closed.
    Inquiry.countDocuments({
      assigneeId: adminUserId,
      status: { $ne: INQUIRY_STATUSES.CLOSED },
    }),
  ]);

  return { notificationsSent, repliesWritten, assignedInquiryCount };
}

module.exports = { getAdminActivity };
