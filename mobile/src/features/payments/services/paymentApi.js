// API calls for (mock) fare payment (Member 03). Screens never call apiClient directly.
import apiClient from '../../../services/apiClient';

/**
 * The payment methods the app accepts, with the label and hint shown in the list.
 * @returns {Promise<object[]>} Supported payment methods.
 */
export async function fetchPaymentMethods() {
  const methodEnvelope = await apiClient.get('/payments/methods');
  return methodEnvelope.data.paymentMethods;
}

/**
 * The passenger's own payment history.
 * @returns {Promise<object[]>} Payments with the ticket key they belong to.
 */
export async function fetchMyPayments() {
  const paymentEnvelope = await apiClient.get('/payments');
  return paymentEnvelope.data.payments;
}

/**
 * Pays the fare for a ticket with the chosen method.
 * @param {object} paymentDetails - ticketId and method.
 * @returns {Promise<object>} The stored payment.
 */
export async function payForTicket(paymentDetails) {
  const paymentEnvelope = await apiClient.post('/payments', paymentDetails);
  return paymentEnvelope.data;
}
