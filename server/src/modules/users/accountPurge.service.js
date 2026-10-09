// Removing an account for good (Member 01, FR-01). Deleting the USER row alone would leave that
// person's tickets, wallet, alerts and inquiries behind, so everything they own goes with it.
// What belongs to somebody else stays: a trip a driver ran is the operator's service record and
// carries other passengers' tickets, so it is kept and only the driver reference is left behind.
const User = require('./user.model');
const DriverProfile = require('../drivers/driverProfile.model');
const OtpVerification = require('../auth/otpVerification.model');
const Ticket = require('../tickets/ticket.model');
const Payment = require('../payments/payment.model');
const SeatBooking = require('../seats/seatBooking.model');
const TicketVerification = require('../verification/ticketVerification.model');
const Wallet = require('../payments/wallet.model');
const WalletTransaction = require('../payments/walletTransaction.model');
const SavedRoute = require('../savedRoutes/savedRoute.model');
const AlertSubscription = require('../alertSubscriptions/alertSubscription.model');
const RecentSearch = require('../recentSearches/recentSearch.model');
const Notification = require('../notifications/notification.model');
const Inquiry = require('../inquiries/inquiry.model');
const InquiryReply = require('../inquiries/inquiryReply.model');
const DelayReport = require('../delays/delayReport.model');
const Bus = require('../buses/bus.model');
const Trip = require('../trips/trip.model');
const { TRIP_STATUSES } = require('../trips/trip.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * Everything a passenger owns: the tickets and what hangs off them, the wallet and its statement,
 * their saved routes, alert subscriptions, recent searches, notifications and inquiries.
 * @param {string} userId - The account being removed.
 * @returns {Promise<void>} Resolves once it is all gone.
 */
async function purgePassengerRecords(userId) {
  const ownTickets = await Ticket.find({ userId }).select('_id');
  const ownTicketIds = ownTickets.map((ownTicket) => ownTicket._id);
  if (ownTicketIds.length > 0) {
    await Promise.all([
      Payment.deleteMany({ ticketId: { $in: ownTicketIds } }),
      SeatBooking.deleteMany({ ticketId: { $in: ownTicketIds } }),
      TicketVerification.deleteMany({ ticketId: { $in: ownTicketIds } }),
    ]);
    await Ticket.deleteMany({ userId });
  }

  const ownWallet = await Wallet.findOne({ userId }).select('_id');
  if (ownWallet) {
    await WalletTransaction.deleteMany({ walletId: ownWallet._id });
    await Wallet.deleteOne({ _id: ownWallet._id });
  }

  const ownInquiries = await Inquiry.find({ userId }).select('_id');
  if (ownInquiries.length > 0) {
    await InquiryReply.deleteMany({
      inquiryId: { $in: ownInquiries.map((ownInquiry) => ownInquiry._id) },
    });
    await Inquiry.deleteMany({ userId });
  }

  await Promise.all([
    SavedRoute.deleteMany({ userId }),
    AlertSubscription.deleteMany({ userId }),
    RecentSearch.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
    OtpVerification.deleteMany({ userId }),
  ]);
}

/**
 * The driver side: the profile, the delays they reported, and the bus they were driving, which goes
 * back to the pool rather than pointing at somebody who no longer exists.
 * @param {string} userId - The account being removed.
 * @returns {Promise<void>} Resolves once it is all gone.
 */
async function purgeDriverRecords(userId) {
  const driverProfile = await DriverProfile.findOne({ userId }).select('_id');
  if (!driverProfile) return;

  const ongoingTrip = await Trip.findOne({
    driverId: driverProfile._id,
    status: TRIP_STATUSES.ONGOING,
  });
  if (ongoingTrip) {
    throw new AppError(
      'End your trip before deleting your account: passengers are tracking this bus.',
      HTTP_STATUS.CONFLICT
    );
  }

  await Promise.all([
    Bus.updateMany({ driverId: driverProfile._id }, { $unset: { driverId: '' } }),
    DelayReport.deleteMany({ driverId: driverProfile._id }),
    TicketVerification.deleteMany({ driverId: driverProfile._id }),
  ]);
  await DriverProfile.deleteOne({ _id: driverProfile._id });
}

/**
 * Deletes an account and everything it owns.
 * @param {string} userId - The account being removed.
 * @returns {Promise<void>} Resolves once the account is gone.
 */
async function purgeUserAndOwnedData(userId) {
  // The driver side runs first because it is the part that can refuse.
  await purgeDriverRecords(userId);
  await purgePassengerRecords(userId);
  // An inquiry this person was handling is handed back to the unassigned queue, not deleted.
  await Inquiry.updateMany({ assigneeId: userId }, { $unset: { assigneeId: '' } });
  await User.findByIdAndDelete(userId);
}

module.exports = { purgeUserAndOwnedData };
