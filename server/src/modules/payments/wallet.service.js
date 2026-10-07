// Mobile-wallet business logic (Member 03, FR-07): top up a prepaid balance and spend it on fares.
// Every change writes a WALLET_TRANSACTION line, so the balance can always be explained.
const Wallet = require('./wallet.model');
const WalletTransaction = require('./walletTransaction.model');
const { WALLET_TRANSACTION_TYPES } = require('./payment.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

/** How many statement lines the wallet screen shows. */
const STATEMENT_LINE_LIMIT = 20;

/**
 * The passenger's wallet, created empty the first time they open the screen.
 * @param {string} userId - Signed-in passenger.
 * @returns {Promise<object>} The wallet document.
 */
async function getOrCreateWallet(userId) {
  const existingWallet = await Wallet.findOne({ userId });
  if (existingWallet) return existingWallet;
  return Wallet.create({ userId, balance: 0 });
}

/**
 * Writes one statement line and moves the balance by it.
 * @param {object} movementDetails - What changed and why.
 * @param {object} movementDetails.wallet - The wallet being changed.
 * @param {string} movementDetails.type - One of WALLET_TRANSACTION_TYPES.
 * @param {number} movementDetails.amount - Positive rupee amount.
 * @param {string} movementDetails.description - Line shown in the statement.
 * @param {string} [movementDetails.ticketId] - Ticket this line relates to.
 * @returns {Promise<object>} The wallet after the movement.
 */
async function recordMovement({ wallet, type, amount, description, ticketId }) {
  const isMoneyIn = type !== WALLET_TRANSACTION_TYPES.FARE;
  const nextBalance = isMoneyIn ? wallet.balance + amount : wallet.balance - amount;

  wallet.balance = nextBalance;
  await wallet.save();

  await WalletTransaction.create({
    walletId: wallet.id,
    type,
    amount,
    balanceAfter: nextBalance,
    description,
    ticketId,
  });
  return wallet;
}

/**
 * The wallet screen: current balance and the recent statement.
 * @param {string} userId - Signed-in passenger.
 * @returns {Promise<object>} Balance and statement lines.
 */
async function getWalletSummary(userId) {
  const wallet = await getOrCreateWallet(userId);
  const transactions = await WalletTransaction.find({ walletId: wallet.id })
    .sort({ createdAt: -1 })
    .limit(STATEMENT_LINE_LIMIT);
  return { balance: wallet.balance, transactions };
}

/**
 * Adds money to the wallet. The top-up itself is mocked: the card details the passenger types are
 * checked for shape, used to decide success, and then thrown away - never stored (NFR-07).
 * @param {string} userId - Signed-in passenger.
 * @param {number} amount - Rupees to add.
 * @returns {Promise<object>} Balance and statement after the top-up.
 */
async function topUpWallet(userId, amount) {
  const wallet = await getOrCreateWallet(userId);
  await recordMovement({
    wallet,
    type: WALLET_TRANSACTION_TYPES.TOPUP,
    amount,
    description: `Top-up of Rs. ${amount}`,
  });
  return getWalletSummary(userId);
}

/**
 * Spends from the wallet, refusing to go below zero so a fare can never be half paid.
 * @param {string} userId - Signed-in passenger.
 * @param {object} spendDetails - Amount, what it was for, and the ticket.
 * @param {number} spendDetails.amount - Rupees to take.
 * @param {string} spendDetails.description - Statement line.
 * @param {string} spendDetails.ticketId - Ticket being paid for.
 * @returns {Promise<object>} The wallet after the spend.
 */
async function spendFromWallet(userId, { amount, description, ticketId }) {
  const wallet = await getOrCreateWallet(userId);
  if (wallet.balance < amount) {
    throw new AppError(
      `Your wallet has Rs. ${wallet.balance} but the fare is Rs. ${amount}. Top up to continue.`,
      HTTP_STATUS.CONFLICT,
      [{ field: 'method', message: 'Not enough wallet balance.' }]
    );
  }
  return recordMovement({
    wallet,
    type: WALLET_TRANSACTION_TYPES.FARE,
    amount,
    description,
    ticketId,
  });
}

/**
 * Puts a refunded fare back, used when a wallet-paid ticket is cancelled.
 * @param {string} userId - Signed-in passenger.
 * @param {object} refundDetails - Amount, reason and the ticket.
 * @param {number} refundDetails.amount - Rupees to give back.
 * @param {string} refundDetails.description - Statement line.
 * @param {string} refundDetails.ticketId - Ticket being refunded.
 * @returns {Promise<object>} The wallet after the refund.
 */
async function refundToWallet(userId, { amount, description, ticketId }) {
  const wallet = await getOrCreateWallet(userId);
  return recordMovement({
    wallet,
    type: WALLET_TRANSACTION_TYPES.REFUND,
    amount,
    description,
    ticketId,
  });
}

module.exports = {
  getOrCreateWallet,
  getWalletSummary,
  topUpWallet,
  spendFromWallet,
  refundToWallet,
};
