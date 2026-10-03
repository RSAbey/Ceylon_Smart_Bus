// Mounts EVERY module router once, so no member needs to edit this shared file later.
const authRouter = require('./modules/auth/auth.routes');
const userRouter = require('./modules/users/user.routes');
const userAdminRouter = require('./modules/users/user.admin.routes');
const driverAdminRouter = require('./modules/drivers/driver.admin.routes');
const routeRouter = require('./modules/routes/route.routes');
const routeAdminRouter = require('./modules/routes/route.admin.routes');
const busAdminRouter = require('./modules/buses/bus.admin.routes');
const tripRouter = require('./modules/trips/trip.routes');
const trackingRouter = require('./modules/tracking/tracking.routes');
const trackingAdminRouter = require('./modules/tracking/tracking.admin.routes');
const savedRouteRouter = require('./modules/savedRoutes/savedRoute.routes');
const ticketRouter = require('./modules/tickets/ticket.routes');
const seatRouter = require('./modules/seats/seat.routes');
const paymentRouter = require('./modules/payments/payment.routes');
const paymentAdminRouter = require('./modules/payments/payment.admin.routes');
const verificationRouter = require('./modules/verification/verification.routes');
const inquiryRouter = require('./modules/inquiries/inquiry.routes');
const inquiryAdminRouter = require('./modules/inquiries/inquiry.admin.routes');
const homeRouter = require('./modules/home/home.routes');
const notificationRouter = require('./modules/notifications/notification.routes');
const alertSubscriptionRouter = require('./modules/alertSubscriptions/alertSubscription.routes');
const delayRouter = require('./modules/delays/delay.routes');
const delayAdminRouter = require('./modules/delays/delay.admin.routes');
const announcementAdminRouter = require('./modules/announcements/announcement.admin.routes');
const recentSearchRouter = require('./modules/recentSearches/recentSearch.routes');
const dashboardAdminRouter = require('./modules/dashboard/dashboard.admin.routes');

/** Passenger / driver APIs. Each router applies authenticateToken per route (login is public). */
const PUBLIC_AND_ROLE_ROUTERS = [
  ['/api/auth', authRouter],
  ['/api/users', userRouter],
  ['/api/routes', routeRouter],
  ['/api/saved-routes', savedRouteRouter],
  ['/api/trips', tripRouter],
  ['/api/tracking', trackingRouter],
  ['/api/tickets', ticketRouter],
  ['/api/seats', seatRouter],
  ['/api/payments', paymentRouter],
  ['/api/verification', verificationRouter],
  ['/api/inquiries', inquiryRouter],
  ['/api/home', homeRouter],
  ['/api/notifications', notificationRouter],
  ['/api/alert-subscriptions', alertSubscriptionRouter],
  ['/api/delays', delayRouter],
  ['/api/recent-searches', recentSearchRouter],
];

/** Admin-only APIs. Each router applies authenticateToken + authorizeRoles('admin') at router level. */
const ADMIN_ROUTERS = [
  ['/api/admin/users', userAdminRouter],
  ['/api/admin/drivers', driverAdminRouter],
  ['/api/admin/routes', routeAdminRouter],
  ['/api/admin/buses', busAdminRouter],
  ['/api/admin/fleet', trackingAdminRouter],
  ['/api/admin/finance', paymentAdminRouter],
  ['/api/admin/inquiries', inquiryAdminRouter],
  ['/api/admin/delays', delayAdminRouter],
  ['/api/admin/announcements', announcementAdminRouter],
  ['/api/admin/dashboard', dashboardAdminRouter],
];

/**
 * Registers all module routers on the Express application.
 * @param {import('express').Express} expressApplication - The app created in app.js.
 * @returns {void}
 */
function registerRoutes(expressApplication) {
  [...PUBLIC_AND_ROLE_ROUTERS, ...ADMIN_ROUTERS].forEach(([mountPath, moduleRouter]) => {
    expressApplication.use(mountPath, moduleRouter);
  });
}

module.exports = registerRoutes;
