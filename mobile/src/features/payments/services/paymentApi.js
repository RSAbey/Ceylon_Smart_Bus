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

/**
 * The passenger's wallet balance and recent statement.
 * @returns {Promise<{balance: number, transactions: object[]}>} Wallet summary.
 */
export async function fetchWallet() {
  const walletEnvelope = await apiClient.get('/payments/wallet');
  return walletEnvelope.data;
}

/**
 * Adds money to the wallet with the demo card details.
 * @param {object} topUpDetails - amount plus the four card fields.
 * @returns {Promise<{balance: number, transactions: object[]}>} Wallet after the top-up.
 */
export async function topUpWallet(topUpDetails) {
  const walletEnvelope = await apiClient.post('/payments/wallet/topup', topUpDetails);
  return walletEnvelope.data;
}
