// Admin dashboard business logic (Member 04, FR-10): the KPI cards on Overview and the series
// behind the Performance charts. Every number is counted from the real collections, never invented.
const User = require('../users/user.model');
const Bus = require('../buses/bus.model');
const Route = require('../routes/route.model');
const Trip = require('../trips/trip.model');
const Ticket = require('../tickets/ticket.model');
const Payment = require('../payments/payment.model');
const DelayReport = require('../delays/delayReport.model');
const Inquiry = require('../inquiries/inquiry.model');
const { USER_ROLES, USER_STATUSES } = require('../users/user.constants');
const { TRIP_STATUSES } = require('../trips/trip.constants');
const { TICKET_STATUSES } = require('../tickets/ticket.constants');
const { PAYMENT_STATUSES } = require('../payments/payment.constants');
const { DELAY_REPORT_STATUSES } = require('../delays/delay.constants');
const { INQUIRY_STATUSES } = require('../inquiries/inquiry.constants');
// Shared with the finance trend, so both pages cut their days at the same boundary.
const { startOfDaysAgo, toDayKey } = require('../../utils/dayWindow');

/** How many days the Performance charts cover. */
const PERFORMANCE_WINDOW_DAYS = 7;
/** How many routes the "busiest routes" table lists. */
const TOP_ROUTE_LIMIT = 5;

/**
 * The KPI cards on the Overview page.
 * @returns {Promise<object>} Counts and today's takings.
 */
async function getOverview() {
  const startOfToday = startOfDaysAgo(0);

  const [
    passengerCount,
    driverCount,
    busCount,
    routeCount,
    ongoingTripCount,
    activeDelayCount,
    openInquiryCount,
    ticketsToday,
    takingsToday,
  ] = await Promise.all([
    User.countDocuments({ role: USER_ROLES.PASSENGER, status: USER_STATUSES.ACTIVE }),
    User.countDocuments({ role: USER_ROLES.DRIVER, status: USER_STATUSES.ACTIVE }),
    Bus.countDocuments(),
    Route.countDocuments(),
    Trip.countDocuments({ status: TRIP_STATUSES.ONGOING }),
    DelayReport.countDocuments({ status: DELAY_REPORT_STATUSES.ACTIVE }),
    Inquiry.countDocuments({ status: INQUIRY_STATUSES.OPEN }),
    Ticket.countDocuments({ createdAt: { $gte: startOfToday } }),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUSES.PAID, paidAt: { $gte: startOfToday } } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]),
  ]);

  return {
    passengerCount,
    driverCount,
    busCount,
    routeCount,
    ongoingTripCount,
    activeDelayCount,
    openInquiryCount,
    ticketsToday,
    takingsToday: takingsToday[0]?.totalAmount || 0,
  };
}

/**
 * Counts documents per day over the chart window, filling in the days with nothing so the chart
 * has no gaps.
 * @param {object} documentModel - The Mongoose model to count.
 * @param {string} dateFieldName - Which date field groups the rows.
 * @param {object} [extraFilter] - Extra match conditions.
 * @param {string} [sumFieldName] - Sum this field instead of counting rows.
 * @returns {Promise<object[]>} One entry per day: { day, total }.
 */
async function buildDailySeries(documentModel, dateFieldName, extraFilter = {}, sumFieldName) {
  const windowStart = startOfDaysAgo(PERFORMANCE_WINDOW_DAYS - 1);
  const groupedRows = await documentModel.aggregate([
    { $match: { ...extraFilter, [dateFieldName]: { $gte: windowStart } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: `$${dateFieldName}` } },
        total: sumFieldName ? { $sum: `$${sumFieldName}` } : { $sum: 1 },
      },
    },
  ]);

  const totalsByDay = new Map(groupedRows.map((groupedRow) => [groupedRow._id, groupedRow.total]));
  const dailySeries = [];
  for (let dayOffset = PERFORMANCE_WINDOW_DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
    const dayKey = toDayKey(startOfDaysAgo(dayOffset));
    dailySeries.push({ day: dayKey, total: totalsByDay.get(dayKey) || 0 });
  }
  return dailySeries;
}

/**
 * The busiest routes by tickets sold, for the Performance table.
 * @returns {Promise<object[]>} Routes with their ticket count and takings.
 */
async function getBusiestRoutes() {
  const groupedRows = await Ticket.aggregate([
    { $match: { status: { $ne: TICKET_STATUSES.CANCELLED } } },
    { $group: { _id: '$routeId', ticketCount: { $sum: 1 }, totalFare: { $sum: '$fareAmount' } } },
    { $sort: { ticketCount: -1 } },
    { $limit: TOP_ROUTE_LIMIT },
  ]);

  const busiestRoutes = await Route.find({
    _id: { $in: groupedRows.map((groupedRow) => groupedRow._id) },
  }).select('routeNumber routeName origin destination');

  return groupedRows.map((groupedRow) => {
    const matchingRoute = busiestRoutes.find(
      (candidateRoute) => candidateRoute.id === String(groupedRow._id)
    );
    return {
      routeId: String(groupedRow._id),
      routeNumber: matchingRoute?.routeNumber || 'Unknown',
      origin: matchingRoute?.origin || null,
      destination: matchingRoute?.destination || null,
      ticketCount: groupedRow.ticketCount,
      totalFare: groupedRow.totalFare,
    };
  });
}

/**
 * How punctual the fleet has been: trips that ran without an active delay, against those that
 * had one. Trips with no delay report at all count as on time.
 * @returns {Promise<object>} On-time and delayed trip counts with the percentage.
 */
async function getPunctuality() {
  const windowStart = startOfDaysAgo(PERFORMANCE_WINDOW_DAYS - 1);
  const [tripCount, delayedTripIds] = await Promise.all([
    Trip.countDocuments({ startedAt: { $gte: windowStart } }),
    DelayReport.distinct('tripId', {
      createdAt: { $gte: windowStart },
      status: { $ne: DELAY_REPORT_STATUSES.CANCELLED },
    }),
  ]);

  const delayedTripCount = delayedTripIds.length;
  const onTimeTripCount = Math.max(0, tripCount - delayedTripCount);
  return {
    tripCount,
    onTimeTripCount,
    delayedTripCount,
    onTimePercentage: tripCount > 0 ? Math.round((onTimeTripCount / tripCount) * 100) : 0,
  };
}

/**
 * Everything the Performance page charts.
 * @returns {Promise<object>} Daily series, busiest routes and punctuality.
 */
async function getPerformance() {
  const [ticketsPerDay, takingsPerDay, delaysPerDay, busiestRoutes, punctuality] = await Promise.all([
    buildDailySeries(Ticket, 'createdAt'),
    buildDailySeries(Payment, 'paidAt', { status: PAYMENT_STATUSES.PAID }, 'amount'),
    buildDailySeries(DelayReport, 'createdAt', {
      status: { $ne: DELAY_REPORT_STATUSES.CANCELLED },
    }),
    getBusiestRoutes(),
    getPunctuality(),
  ]);

  return {
    windowDays: PERFORMANCE_WINDOW_DAYS,
    ticketsPerDay,
    takingsPerDay,
    delaysPerDay,
    busiestRoutes,
    punctuality,
  };
}

module.exports = { getOverview, getPerformance };
