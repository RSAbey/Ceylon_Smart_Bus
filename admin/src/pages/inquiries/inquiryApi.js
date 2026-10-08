// API calls for the admin inquiry inbox (Member 03): the list, one conversation, and the actions
// an administrator takes on it.
import apiClient from '../../services/apiClient';

/**
 * The inbox with its counts.
 * @param {object} [inboxFilters] - Inbox filters.
 * @param {string} [inboxFilters.status] - One INQUIRY_STATUSES value.
 * @param {string} [inboxFilters.tag] - One INQUIRY_TAGS value.
 * @param {string} [inboxFilters.priority] - One INQUIRY_PRIORITIES value.
 * @param {string} [inboxFilters.assigneeId] - An admin id, or "unassigned".
 * @param {string} [inboxFilters.searchText] - Matches the subject or the message.
 * @returns {Promise<object>} Inquiries with the counts above the table.
 */
export async function fetchInquiryInbox({ status, tag, priority, assigneeId, searchText } = {}) {
  const inboxEnvelope = await apiClient.get('/admin/inquiries', {
    params: {
      status: status || undefined,
      tag: tag || undefined,
      priority: priority || undefined,
      assigneeId: assigneeId || undefined,
      search: searchText || undefined,
    },
  });
  return inboxEnvelope.data;
}

/**
 * One inquiry with its replies.
 * @param {string} inquiryId - Inquiry to open.
 * @returns {Promise<object>} The inquiry and its replies.
 */
export async function fetchInquiryDetails(inquiryId) {
  const inquiryEnvelope = await apiClient.get(`/admin/inquiries/${inquiryId}`);
  return inquiryEnvelope.data;
}

/**
 * Answers an inquiry. The server also alerts the author in the app.
 * @param {string} inquiryId - Inquiry being answered.
 * @param {string} message - Reply text.
 * @returns {Promise<object>} The stored reply.
 */
export async function replyToInquiry(inquiryId, message) {
  const replyEnvelope = await apiClient.post(`/admin/inquiries/${inquiryId}/replies`, { message });
  return replyEnvelope.data;
}

/**
 * Closes an inquiry that has been dealt with.
 * @param {string} inquiryId - Inquiry to close.
 * @returns {Promise<void>} Resolves once closed.
 */
export async function closeInquiry(inquiryId) {
  await apiClient.patch(`/admin/inquiries/${inquiryId}/close`);
}

/**
 * Puts a closed inquiry back on the list so it can be answered again.
 * @param {string} inquiryId - Inquiry to reopen.
 * @returns {Promise<void>} Resolves once reopened.
 */
export async function reopenInquiry(inquiryId) {
  await apiClient.patch(`/admin/inquiries/${inquiryId}/reopen`);
}

/**
 * Hands an inquiry to an administrator, or puts it back in the unassigned queue.
 * @param {string} inquiryId - Inquiry to hand over.
 * @param {string | null} assigneeId - The admin taking it, or null to unassign.
 * @returns {Promise<object>} The inquiry with its assignee.
 */
export async function assignInquiry(inquiryId, assigneeId) {
  const assignEnvelope = await apiClient.patch(`/admin/inquiries/${inquiryId}/assignee`, {
    assigneeId,
  });
  return assignEnvelope.data;
}

/**
 * The administrators an inquiry can be assigned to.
 * @returns {Promise<object[]>} Admin accounts.
 */
export async function fetchAdmins() {
  const adminEnvelope = await apiClient.get('/admin/users', { params: { role: 'admin' } });
  return adminEnvelope.data.users;
}
