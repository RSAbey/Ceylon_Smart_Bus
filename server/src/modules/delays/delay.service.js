// Delay business logic (Member 04, FR-08): a driver reports a delay on the trip they are running,
// and everyone affected is told. getActiveDelayMinutes is a shared contract used by Member 02's ETA.
const DelayReport = require('./delayReport.model');
const Trip = require('../trips/trip.model');
const tripService = require('../trips/trip.service');
const ticketService = require('../tickets/ticket.service');
const savedRouteService = require('../savedRoutes/savedRoute.service');
const alertSubscriptionService = require('../alertSubscriptions/alertSubscription.service');
const notificationService = require('../notifications/notification.service');
const { DELAY_REASONS, DELAY_REPORT_STATUSES, DELAY_REASON_LABELS } = require('./delay.constants');
const { ALERT_TYPES } = require('../alertSubscriptions/alertSubscription.constants');
const { NOTIFICATION_TYPES } = require('../notifications/notification.constants');
const { TRIP_STATUSES } = require('../trips/trip.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

const NO_DELAY_MINUTES = 0;

/**
 * Returns how many minutes the trip is currently delayed by, so the ETA of stops ahead can be increased (FR-08).
 * @param {string} tripId - Trip to check.
 * @returns {Promise<number>} Minutes of the active delay report, or 0 when there is none.
 */
async function getActiveDelayMinutes(tripId) {
  const activeDelayReport = await DelayReport.findOne({
    tripId,
    status: DELAY_REPORT_STATUSES.ACTIVE,
  }).select('delayMinutes');
  return activeDelayReport ? activeDelayReport.delayMinutes : NO_DELAY_MINUTES;
}

/**
 * Everyone who should hear about a delay on a trip: passengers holding a ticket for that bus, those
 * who saved the route, and those who subscribed to delay alerts for it. Each person is told once.
 * @param {object} delayedTrip - The trip that is running late.
 * @returns {Promise<string[]>} Distinct user ids as strings.
 */
async function findDelayAudience(delayedTrip) {
  const [ticketHolderIds, savedRouteUserIds, subscriberUserIds] = await Promise.all([
    ticketService.getActiveTicketHolderIds(delayedTrip.id),
    savedRouteService.getUserIdsBySavedRoute(delayedTrip.routeId),
    alertSubscriptionService.getSubscriberUserIds(delayedTrip.routeId, ALERT_TYPES.DELAY),
  ]);
  return [...ticketHolderIds, ...savedRouteUserIds, ...subscriberUserIds];
}

/**
 * Builds the wording passengers see for a delay.
 * @param {object} delayReport - The report being announced.
 * @param {object} delayedRoute - The route the bus runs on.
 * @returns {{title: string, message: string}} Notification wording.
 */
function buildDelayWording(delayReport, delayedRoute) {
  const reasonLabel = DELAY_REASON_LABELS[delayReport.reason] || 'a delay';
  const routeLabel = delayedRoute ? `Route ${delayedRoute.routeNumber}` : 'Your bus';
  return {
    title: `${routeLabel} is running ${delayReport.delayMinutes} min late`,
    message: delayReport.reasonNote
      ? `${reasonLabel}: ${delayReport.reasonNote}`
      : `Reported reason: ${reasonLabel}.`,
  };
}

/**
 * Tells the affected passengers about a delay.
 * @param {object} delayReport - The report to announce.
 * @param {object} delayedTrip - The trip it belongs to, with its route populated.
 * @returns {Promise<number>} How many notifications were created.
 */
async function announceDelay(delayReport, delayedTrip) {
  const recipientUserIds = await findDelayAudience(delayedTrip);
  const { title, message } = buildDelayWording(delayReport, delayedTrip.routeId);
  return notificationService.createNotification({
    recipientUserIds,
    type: NOTIFICATION_TYPES.DELAY,
    title,
    message,
    related: {
      routeId: delayedTrip.routeId?.id || delayedTrip.routeId,
      tripId: delayedTrip.id,
      delayReportId: delayReport.id,
    },
  });
}

/**
 * The driver's ongoing trip, refusing to report a delay when no trip is running.
 * @param {string} userId - Signed-in driver's user id.
 * @returns {Promise<{driverProfile: object, runningTrip: object}>} Driver and their trip.
 */
async function getRunningTripForDriver(userId) {
  const driverProfile = await tripService.getDriverProfileForUser(userId);
  const runningTrip = await Trip.findOne({
    driverId: driverProfile.id,
    status: TRIP_STATUSES.ONGOING,
  }).populate('routeId');
  if (!runningTrip) {
    throw new AppError(
      'Start your trip before reporting a delay, so passengers know which bus is late.',
      HTTP_STATUS.CONFLICT
    );
  }
  return { driverProfile, runningTrip };
}

/**
 * Reports a delay on the driver's running trip. Reporting twice updates the active report instead
 * of creating a second one, which is what the partial unique index enforces.
 * @param {string} userId - Signed-in driver's user id.
 * @param {object} delayDetails - reason, reasonNote and delayMinutes.
 * @returns {Promise<object>} The stored report with how many passengers were told.
 */
async function reportDelay(userId, delayDetails) {
  const { driverProfile, runningTrip } = await getRunningTripForDriver(userId);

  const existingReport = await DelayReport.findOne({
    tripId: runningTrip.id,
    status: DELAY_REPORT_STATUSES.ACTIVE,
  });

  // "Other" without a note says nothing useful, so the model refuses it; clear the old note otherwise.
  const reasonNote =
    delayDetails.reason === DELAY_REASONS.OTHER ? delayDetails.reasonNote : undefined;

  let delayReport;
  if (existingReport) {
    existingReport.reason = delayDetails.reason;
    existingReport.reasonNote = reasonNote;
    existingReport.delayMinutes = delayDetails.delayMinutes;
    delayReport = await existingReport.save();
  } else {
    delayReport = await DelayReport.create({
      tripId: runningTrip.id,
      driverId: driverProfile.id,
      reason: delayDetails.reason,
      reasonNote,
      delayMinutes: delayDetails.delayMinutes,
    });
  }

  const notifiedCount = await announceDelay(delayReport, runningTrip);
  return { delayReport, notifiedCount };
}

/**
 * The delay on the driver's running trip, for the banner on their dashboard.
 * @param {string} userId - Signed-in driver's user id.
 * @returns {Promise<object | null>} The active report, or null when the bus is on time.
 */
async function getActiveDelayForDriver(userId) {
  const driverProfile = await tripService.getDriverProfileForUser(userId);
  const runningTrip = await tripService.getOngoingTripForDriver(driverProfile.id);
  if (!runningTrip) return null;
  return DelayReport.findOne({ tripId: runningTrip.id, status: DELAY_REPORT_STATUSES.ACTIVE });
}

/**
 * The driver's own delay history, newest first.
 * @param {string} userId - Signed-in driver's user id.
 * @param {string} [status] - One of DELAY_REPORT_STATUSES.
 * @returns {Promise<object[]>} Reports with the route they were on.
 */
async function listMyDelayReports(userId, status) {
  const driverProfile = await tripService.getDriverProfileForUser(userId);
  const reportFilter = { driverId: driverProfile.id };
  if (status) reportFilter.status = status;

  const delayReports = await DelayReport.find(reportFilter).sort({ createdAt: -1 });
  return Promise.all(
    delayReports.map(async (delayReport) => {
      const reportedTrip = await Trip.findById(delayReport.tripId).populate(
        'routeId',
        'routeNumber origin destination'
      );
      return { delayReport, route: reportedTrip?.routeId || null };
    })
  );
}

/**
 * Loads a report the signed-in driver filed, refusing to touch another driver's.
 * @param {string} userId - Signed-in driver's user id.
 * @param {string} delayReportId - Report to load.
 * @returns {Promise<object>} The report document.
 */
async function getOwnDelayReport(userId, delayReportId) {
  const driverProfile = await tripService.getDriverProfileForUser(userId);
  const matchingReport = await DelayReport.findById(delayReportId);
  if (!matchingReport) {
    throw new AppError('Delay report not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (String(matchingReport.driverId) !== String(driverProfile.id)) {
    throw new AppError('You can only change your own delay reports.', HTTP_STATUS.FORBIDDEN);
  }
  return matchingReport;
}

/**
 * Updates an active report, for example when the hold-up gets longer. Passengers are told again,
 * because the number they were given has changed.
 * @param {string} userId - Signed-in driver's user id.
 * @param {string} delayReportId - Report to change.
 * @param {object} delayChanges - reason, reasonNote and/or delayMinutes.
 * @returns {Promise<object>} The updated report.
 */
async function updateDelayReport(userId, delayReportId, delayChanges) {
  const editableReport = await getOwnDelayReport(userId, delayReportId);
  if (editableReport.status !== DELAY_REPORT_STATUSES.ACTIVE) {
    throw new AppError(
      `This report is ${editableReport.status} and can no longer be changed.`,
      HTTP_STATUS.CONFLICT
    );
  }

  if (delayChanges.reason !== undefined) {
    editableReport.reason = delayChanges.reason;
    editableReport.reasonNote =
      delayChanges.reason === DELAY_REASONS.OTHER ? delayChanges.reasonNote : undefined;
  } else if (delayChanges.reasonNote !== undefined) {
    editableReport.reasonNote = delayChanges.reasonNote;
  }
  if (delayChanges.delayMinutes !== undefined) {
    editableReport.delayMinutes = delayChanges.delayMinutes;
  }
  await editableReport.save();

  const reportedTrip = await Trip.findById(editableReport.tripId).populate('routeId');
  const notifiedCount = reportedTrip ? await announceDelay(editableReport, reportedTrip) : 0;
  return { delayReport: editableReport, notifiedCount };
}

/**
 * Marks a delay over ("back on time") and tells the passengers the good news.
 * @param {string} userId - Signed-in driver's user id.
 * @param {string} delayReportId - Report to resolve.
 * @returns {Promise<object>} The resolved report.
 */
async function resolveDelayReport(userId, delayReportId) {
  const resolvableReport = await getOwnDelayReport(userId, delayReportId);
  if (resolvableReport.status !== DELAY_REPORT_STATUSES.ACTIVE) {
    throw new AppError(`This report is already ${resolvableReport.status}.`, HTTP_STATUS.CONFLICT);
  }
  resolvableReport.status = DELAY_REPORT_STATUSES.RESOLVED;
  resolvableReport.resolvedAt = new Date();
  await resolvableReport.save();

  const reportedTrip = await Trip.findById(resolvableReport.tripId).populate('routeId');
  if (reportedTrip) {
    const recipientUserIds = await findDelayAudience(reportedTrip);
    await notificationService.createNotification({
      recipientUserIds,
      type: NOTIFICATION_TYPES.DELAY,
      title: `Route ${reportedTrip.routeId?.routeNumber} is back on time`,
      message: 'The driver reports the hold-up is over.',
      related: {
        routeId: reportedTrip.routeId?.id || reportedTrip.routeId,
        tripId: reportedTrip.id,
        delayReportId: resolvableReport.id,
      },
    });
  }
  return resolvableReport;
}

/**
 * Withdraws a report filed by mistake. It is kept as "cancelled" rather than deleted, so the
 * admin delay table still shows what happened.
 * @param {string} userId - Signed-in driver's user id.
 * @param {string} delayReportId - Report to cancel.
 * @returns {Promise<object>} The cancelled report.
 */
async function cancelDelayReport(userId, delayReportId) {
  const cancellableReport = await getOwnDelayReport(userId, delayReportId);
  if (cancellableReport.status !== DELAY_REPORT_STATUSES.ACTIVE) {
    throw new AppError(`This report is already ${cancellableReport.status}.`, HTTP_STATUS.CONFLICT);
  }
  cancellableReport.status = DELAY_REPORT_STATUSES.CANCELLED;
  await cancellableReport.save();
  return cancellableReport;
}

/**
 * The admin delay table: every report with its driver, bus and route.
 * @param {object} [tableFilters] - Optional status and reason filters.
 * @returns {Promise<object[]>} Reports newest first.
 */
async function listAllDelayReports(tableFilters = {}) {
  const reportFilter = {};
  ['status', 'reason'].forEach((filterName) => {
    if (tableFilters[filterName]) reportFilter[filterName] = tableFilters[filterName];
  });

  const delayReports = await DelayReport.find(reportFilter)
    .sort({ createdAt: -1 })
    .populate({ path: 'driverId', populate: { path: 'userId', select: 'fullName' } });

  return Promise.all(
    delayReports.map(async (delayReport) => {
      const reportedTrip = await Trip.findById(delayReport.tripId).populate([
        { path: 'routeId', select: 'routeNumber origin destination' },
        { path: 'busId', select: 'plateNumber busName' },
      ]);
      return {
        delayReport,
        driverName: delayReport.driverId?.userId?.fullName || null,
        route: reportedTrip?.routeId || null,
        bus: reportedTrip?.busId || null,
      };
    })
  );
}

/**
 * An admin acknowledging a report: adds a note and optionally closes it.
 * @param {string} adminUserId - Signed-in admin.
 * @param {string} delayReportId - Report to review.
 * @param {object} reviewDetails - adminNote and/or status.
 * @returns {Promise<object>} The reviewed report.
 */
async function reviewDelayReport(adminUserId, delayReportId, reviewDetails) {
  const reviewableReport = await DelayReport.findById(delayReportId);
  if (!reviewableReport) {
    throw new AppError('Delay report not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (reviewDetails.adminNote !== undefined) {
    reviewableReport.adminNote = reviewDetails.adminNote;
  }
  if (reviewDetails.status !== undefined) {
    reviewableReport.status = reviewDetails.status;
    if (reviewDetails.status === DELAY_REPORT_STATUSES.RESOLVED) {
      reviewableReport.resolvedAt = new Date();
    }
  }
  reviewableReport.reviewedBy = adminUserId;
  await reviewableReport.save();
  return reviewableReport;
}

module.exports = {
  getActiveDelayMinutes,
  reportDelay,
  getActiveDelayForDriver,
  listMyDelayReports,
  updateDelayReport,
  resolveDelayReport,
  cancelDelayReport,
  listAllDelayReports,
  reviewDelayReport,
};
