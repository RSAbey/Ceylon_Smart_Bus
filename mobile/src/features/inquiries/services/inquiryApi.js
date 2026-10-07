// API calls for support inquiries (Member 03). Screens never call apiClient directly.
import apiClient from '../../../services/apiClient';

/**
 * The signed-in user's own inquiries, newest first.
 * @param {string} [status] - Optional INQUIRY_STATUSES value to filter by.
 * @returns {Promise<object[]>} Inquiries with their reply count and edit flag.
 */
export async function fetchMyInquiries(status) {
  const inquiryEnvelope = await apiClient.get('/inquiries', { params: status ? { status } : {} });
  return inquiryEnvelope.data.inquiries;
}

/**
 * One inquiry with the admin replies underneath it.
 * @param {string} inquiryId - Inquiry to open.
 * @returns {Promise<object>} The inquiry, its replies and whether it can still be edited.
 */
export async function fetchInquiryDetails(inquiryId) {
  const inquiryEnvelope = await apiClient.get(`/inquiries/${inquiryId}`);
  return inquiryEnvelope.data;
}

/**
 * Raises a new inquiry.
 * @param {object} inquiryDetails - subject, message, tag, priority and optional routeId.
 * @returns {Promise<object>} The stored inquiry.
 */
export async function createInquiry(inquiryDetails) {
  const inquiryEnvelope = await apiClient.post('/inquiries', inquiryDetails);
  return inquiryEnvelope.data;
}

/**
 * Corrects an inquiry inside its edit window.
 * @param {string} inquiryId - Inquiry to change.
 * @param {object} inquiryChanges - Any of subject, message, tag, priority.
 * @returns {Promise<object>} The updated inquiry.
 */
export async function updateInquiry(inquiryId, inquiryChanges) {
  const inquiryEnvelope = await apiClient.put(`/inquiries/${inquiryId}`, inquiryChanges);
  return inquiryEnvelope.data;
}

/**
 * Withdraws an inquiry inside its edit window.
 * @param {string} inquiryId - Inquiry to delete.
 * @returns {Promise<void>} Resolves once deleted.
 */
export async function deleteInquiry(inquiryId) {
  await apiClient.delete(`/inquiries/${inquiryId}`);
}
