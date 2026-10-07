// Constants for the profile feature (Member 01). Put values here instead of magic strings in screens.

/**
 * Rows on the Profile screen. `route` entries that point at a placeholder belong to features no member
 * owns in Milestone 03; they are listed so the screen matches the design, and they say who will build them.
 */
export const PROFILE_SECTIONS = Object.freeze([
  {
    key: 'account',
    title: 'Account settings',
    rows: [
      {
        key: 'personal',
        label: 'Personal information',
        description: 'Name, email and mobile number',
        iconName: 'person-outline',
        route: '/(passenger)/edit-profile',
      },
      {
        key: 'payment',
        label: 'Payment methods',
        description: 'Cards and mobile wallets',
        iconName: 'card-outline',
        route: '/(passenger)/payment-methods',
      },
      {
        key: 'saved-routes',
        label: 'Saved routes',
        description: 'Routes you travel often',
        iconName: 'bookmark-outline',
        route: '/(passenger)/saved-routes',
      },
      {
        key: 'alerts',
        label: 'Notification settings',
        description: 'Choose which bus alerts you receive',
        iconName: 'notifications-outline',
        route: '/(passenger)/alert-settings',
      },
    ],
  },
  {
    key: 'support',
    title: 'Support & legal',
    rows: [
      {
        key: 'help',
        label: 'Help & support',
        description: 'Send an inquiry to our team',
        iconName: 'help-circle-outline',
        route: '/(passenger)/inquiries',
      },
      {
        key: 'terms',
        label: 'Terms of service',
        description: 'How you may use the platform',
        iconName: 'document-text-outline',
        route: '/(passenger)/legal/terms',
      },
      {
        key: 'privacy',
        label: 'Privacy policy',
        description: 'How your data is processed',
        iconName: 'lock-closed-outline',
        route: '/(passenger)/legal/privacy',
      },
    ],
  },
]);

/** Shown at the bottom of the Profile screen; keep in step with app.config.js. */
export const APP_VERSION_LABEL = 'Ceylon Smart Bus 1.0.0';

export const LOGOUT_DIALOG = Object.freeze({
  title: 'Log out?',
  message:
    'Are you sure you want to sign out? You will need to enter your details again next time you open the app.',
  confirmLabel: 'Sign out',
});

export const DELETE_ACCOUNT_DIALOG = Object.freeze({
  title: 'Delete your account?',
  message:
    'This permanently removes your account, tickets and saved routes. This cannot be undone.',
  confirmLabel: 'Delete account',
});

/** Section headings on the driver's Profile screen. */
export const DRIVER_PROFILE_SECTIONS = Object.freeze({
  account: 'Account settings',
  safety: 'Support & legal',
});
