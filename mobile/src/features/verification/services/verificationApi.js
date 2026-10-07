// API calls for the driver's ticket check (Member 03). Screens never call apiClient directly.
import apiClient from '../../../services/apiClient';

/**
 * Checks a ticket. Send qrSignature from a scan, or only the ticketKey when the driver types it.
 * @param {object} checkRequest - ticketKey and, for a scan, qrSignature.
 * @returns {Promise<object>} isValid, the reason to show, and the journey details on a match.
 */
export async function verifyTicket(checkRequest) {
  const verificationEnvelope = await apiClient.post('/verification', checkRequest);
  return verificationEnvelope.data;
}

/**
 * The driver's recent checks, listed under the scanner.
 * @returns {Promise<object[]>} Recent verifications, newest first.
 */
export async function fetchMyVerifications() {
  const verificationEnvelope = await apiClient.get('/verification/mine');
  return verificationEnvelope.data.verifications;
}
