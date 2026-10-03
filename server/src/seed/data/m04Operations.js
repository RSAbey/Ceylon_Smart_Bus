// Demo operations data (Member 04 tables): recent searches, 1 active delay, 1 published announcement, 3 notifications.
const RecentSearch = require('../../modules/recentSearches/recentSearch.model');
const DelayReport = require('../../modules/delays/delayReport.model');
const Announcement = require('../../modules/announcements/announcement.model');
const { createNotification } = require('../../modules/notifications/notification.service');
const { NOTIFICATION_TYPES } = require('../../modules/notifications/notification.constants');
const { DELAY_REASONS } = require('../../modules/delays/delay.constants');
const {
  ANNOUNCEMENT_SEVERITIES,
  ANNOUNCEMENT_STATUSES,
} = require('../../modules/announcements/announcement.constants');

const DEMO_DELAY_MINUTES = 15;
const ANNOUNCEMENT_VALID_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

/**
 * Inserts a few recent searches for two passengers.
 * @param {object[]} passengerUsers - Demo passengers.
 * @param {object[]} routes - Routes 154 and 138.
 * @returns {Promise<void>} Resolves when inserted.
 */
async function seedRecentSearches(passengerUsers, routes) {
  const [anjali, kasun] = passengerUsers;
  const [route154, route138] = routes;
  await RecentSearch.insertMany([
    { userId: anjali.id, originText: 'Malabe', destinationText: 'Pettah', routeId: route154.id },
    { userId: anjali.id, originText: 'Nugegoda', destinationText: 'Homagama', routeId: route138.id },
    { userId: kasun.id, originText: 'Battaramulla', destinationText: 'Borella', routeId: route154.id },
  ]);
}

/**
 * Sends Anjali the three demo notifications through the shared createNotification contract.
 * @param {object} anjali - Passenger who saved route 154 and holds the active ticket.
 * @param {object} ongoingTrip - Trip on route 154.
 * @param {object} activeDelayReport - Delay on that trip.
 * @returns {Promise<void>} Resolves when inserted.
 */
async function seedDemoNotifications(anjali, ongoingTrip, activeDelayReport) {
  const tripLinks = { routeId: ongoingTrip.routeId, tripId: ongoingTrip.id };
  await createNotification({
    recipientUserIds: [anjali.id],
    type: NOTIFICATION_TYPES.TICKET,
    title: 'Ticket confirmed',
    message: 'Seat 12 on bus 154, Malabe to Pettah. Show the QR code when you board.',
    related: tripLinks,
  });
  await createNotification({
    recipientUserIds: [anjali.id],
    type: NOTIFICATION_TYPES.DELAY,
    title: 'Bus 154 delayed by 15 minutes',
    message: 'Heavy traffic near Battaramulla. Your arrival time has been updated.',
    related: { ...tripLinks, delayReportId: activeDelayReport.id },
  });
  await createNotification({
    recipientUserIds: [anjali.id],
    type: NOTIFICATION_TYPES.BUS_APPROACHING,
    title: 'Bus 154 is approaching',
    message: 'Your bus is about 5 minutes from Rajagiriya.',
    related: tripLinks,
  });
}

/**
 * Seeds Member 04 operations data.
 * @param {object} accounts - Output of seedAccounts().
 * @param {object} fleet - Output of seedFleet().
 * @returns {Promise<void>} Resolves when everything is inserted.
 */
async function seedOperations(accounts, fleet) {
  const { adminUser, passengerUsers } = accounts;
  const { routes, ongoingTrip } = fleet;
  await seedRecentSearches(passengerUsers, routes);

  const activeDelayReport = await DelayReport.create({
    tripId: ongoingTrip.id,
    driverId: ongoingTrip.driverId,
    reason: DELAY_REASONS.HEAVY_TRAFFIC,
    delayMinutes: DEMO_DELAY_MINUTES,
  });

  await Announcement.create({
    adminId: adminUser.id,
    title: 'Road works on Baseline Road',
    message: 'Expect delays of up to 10 minutes near Borella between 9 am and 4 pm this week.',
    severity: ANNOUNCEMENT_SEVERITIES.WARNING,
    status: ANNOUNCEMENT_STATUSES.PUBLISHED,
    publishedAt: new Date(),
    expiresAt: new Date(Date.now() + ANNOUNCEMENT_VALID_MILLISECONDS),
  });

  await seedDemoNotifications(passengerUsers[0], ongoingTrip, activeDelayReport);
}

module.exports = { seedOperations };
