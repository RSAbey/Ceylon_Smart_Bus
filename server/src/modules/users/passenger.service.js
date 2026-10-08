// Passenger records for the admin dashboard (Member 01, FR-01 / FR-10): who holds an account and
// what they have done with it. It reads other modules' collections — tickets, wallets, inquiries —
// but only ever reads them, so the rules that own those rows stay in their own services.
const User = require('./user.model');
const Ticket = require('../tickets/ticket.model');
const Payment = require('../payments/payment.model');
const Wallet = require('../payments/wallet.model');
const Inquiry = require('../inquiries/inquiry.model');
const SavedRoute = require('../savedRoutes/savedRoute.model');
const { USER_ROLES, USER_STATUSES } = require('./user.constants');
const { TICKET_STATUSES } = require('../tickets/ticket.constants');
const { PAYMENT_STATUSES } = require('../payments/payment.constants');
const { INQUIRY_STATUSES } = require('../inquiries/inquiry.constants');
const { startOfDaysAgo } = require('../../utils/dayWindow');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

/** How many days back counts as a new passenger on the summary card. */
const NEW_PASSENGER_WINDOW_DAYS = 7;
/** How many of a passenger's latest tickets the profile shows. */
const RECENT_TICKET_LIMIT = 5;
/** The collection the payments are joined to when a passenger's spending is totalled. */
const TICKET_COLLECTION_NAME = 'tickets';

/**
 * Builds the Mongo filter behind the passenger list.
 * @param {object} listFilters - Filters from the page.
 * @param {string} [listFilters.status] - One USER_STATUSES value.
 * @param {string} [listFilters.searchText] - Matches the name, email or mobile number.
 * @returns {object} A filter for User.find.
 */
function buildPassengerFilter({ status, searchText }) {
  const passengerFilter = { role: USER_ROLES.PASSENGER };
  if (status) passengerFilter.status = status;
  if (searchText) {
    // Escape the input so somebody typing "." or "*" cannot build their own regular expression.
    const safeSearchText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchPattern = new RegExp(safeSearchText, 'i');
    passengerFilter.$or = [
      { fullName: searchPattern },
      { email: searchPattern },
      { mobile: searchPattern },
    ];
  }
  return passengerFilter;
}

/**
 * Groups ticket activity by passenger in one query, so the list does not query per row.
 * @param {string[]} passengerIds - Passengers being listed.
 * @returns {Promise<Map<string, object>>} Ticket figures keyed by user id.
 */
async function loadTicketActivity(passengerIds) {
  const ticketRows = await Ticket.aggregate([
    { $match: { userId: { $in: passengerIds } } },
    {
      $group: {
        _id: '$userId',
        ticketCount: { $sum: 1 },
        activeTicketCount: {
          $sum: { $cond: [{ $eq: ['$status', TICKET_STATUSES.ACTIVE] }, 1, 0] },
        },
        lastTicketAt: { $max: '$createdAt' },
      },
    },
  ]);
  return new Map(ticketRows.map((ticketRow) => [String(ticketRow._id), ticketRow]));
}

/**
 * The passenger roster with what each one has done, and the counts above the table.
 * @param {object} [listFilters] - Optional status and searchText.
 * @returns {Promise<object>} Passengers newest first, with the summary counts.
 */
async function listPassengersForAdmin(listFilters = {}) {
  const passengers = await User.find(buildPassengerFilter(listFilters)).sort({ createdAt: -1 });
  const passengerIds = passengers.map((passenger) => passenger._id);

  const [ticketActivity, wallets, openInquiryRows] = await Promise.all([
    loadTicketActivity(passengerIds),
    Wallet.find({ userId: { $in: passengerIds } }).select('userId balance'),
    Inquiry.aggregate([
      { $match: { userId: { $in: passengerIds }, status: { $ne: INQUIRY_STATUSES.CLOSED } } },
      { $group: { _id: '$userId', openInquiryCount: { $sum: 1 } } },
    ]),
  ]);

  const balancesByPassenger = new Map(
    wallets.map((wallet) => [String(wallet.userId), wallet.balance])
  );
  const inquiriesByPassenger = new Map(
    openInquiryRows.map((inquiryRow) => [String(inquiryRow._id), inquiryRow.openInquiryCount])
  );

  const passengerRows = passengers.map((passenger) => {
    const tickets = ticketActivity.get(passenger.id);
    return {
      account: passenger,
      ticketCount: tickets?.ticketCount || 0,
      // The number the block dialog warns about: journeys this passenger has already paid for.
      activeTicketCount: tickets?.activeTicketCount || 0,
      lastTicketAt: tickets?.lastTicketAt || null,
      walletBalance: balancesByPassenger.get(passenger.id) ?? null,
      openInquiryCount: inquiriesByPassenger.get(passenger.id) || 0,
    };
  });

  const [totalCount, activeCount, blockedCount, newThisWeekCount] = await Promise.all([
    User.countDocuments({ role: USER_ROLES.PASSENGER }),
    User.countDocuments({ role: USER_ROLES.PASSENGER, status: USER_STATUSES.ACTIVE }),
    User.countDocuments({ role: USER_ROLES.PASSENGER, status: USER_STATUSES.BLOCKED }),
    User.countDocuments({
      role: USER_ROLES.PASSENGER,
      createdAt: { $gte: startOfDaysAgo(NEW_PASSENGER_WINDOW_DAYS - 1) },
    }),
  ]);

  return {
    passengers: passengerRows,
    summary: {
      totalCount,
      activeCount,
      blockedCount,
      newThisWeekCount,
      newWindowDays: NEW_PASSENGER_WINDOW_DAYS,
    },
  };
}

/**
 * One passenger's record: the account, what they have spent, their latest tickets and anything
 * they are still waiting to hear back about. This is what support reads before answering a call.
 * @param {string} passengerId - The passenger to open.
 * @returns {Promise<object>} The passenger profile.
 */
async function getPassengerForAdmin(passengerId) {
  const passenger = await User.findById(passengerId);
  if (!passenger || passenger.role !== USER_ROLES.PASSENGER) {
    throw new AppError('Passenger not found.', HTTP_STATUS.NOT_FOUND);
  }

  const [ticketActivity, wallet, recentTickets, openInquiries, savedRouteCount, spendingRows] =
    await Promise.all([
      loadTicketActivity([passenger._id]),
      Wallet.findOne({ userId: passenger.id }).select('balance'),
      Ticket.find({ userId: passenger.id })
        .sort({ createdAt: -1 })
        .limit(RECENT_TICKET_LIMIT)
        .populate('routeId', 'routeNumber origin destination'),
      Inquiry.find({ userId: passenger.id, status: { $ne: INQUIRY_STATUSES.CLOSED } })
        .sort({ createdAt: -1 })
        .select('subject status priority createdAt'),
      SavedRoute.countDocuments({ userId: passenger.id }),
      Payment.aggregate([
        { $match: { status: PAYMENT_STATUSES.PAID } },
        {
          $lookup: {
            from: TICKET_COLLECTION_NAME,
            localField: 'ticketId',
            foreignField: '_id',
            as: 'paidTickets',
          },
        },
        { $unwind: '$paidTickets' },
        { $match: { 'paidTickets.userId': passenger._id } },
        { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
      ]),
    ]);

  const tickets = ticketActivity.get(passenger.id);
  return {
    account: passenger,
    ticketCount: tickets?.ticketCount || 0,
    activeTicketCount: tickets?.activeTicketCount || 0,
    lastTicketAt: tickets?.lastTicketAt || null,
    walletBalance: wallet?.balance ?? null,
    totalPaid: spendingRows[0]?.totalPaid || 0,
    savedRouteCount,
    recentTickets,
    openInquiries,
  };
}

module.exports = { listPassengersForAdmin, getPassengerForAdmin };
