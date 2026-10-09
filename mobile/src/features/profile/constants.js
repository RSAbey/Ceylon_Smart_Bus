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
        key: 'password',
        label: 'Change password',
        description: 'Keep your account yours',
        iconName: 'key-outline',
        route: '/(passenger)/change-password',
      },
      {
        key: 'app-lock',
        label: 'App lock',
        description: 'Ask for a PIN when the app opens',
        iconName: 'lock-closed-outline',
        route: '/(passenger)/app-lock',
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

/** Wording on the Change password screen. */
export const PASSWORD_MESSAGES = Object.freeze({
  explanation:
    'Your current password is asked for as well, so a phone left unlocked cannot be used to lock you out of your own account.',
  currentRequired: 'Enter your current password.',
  newTooWeak: 'Finish the three rules under the password box.',
  confirmMismatch: 'Both new password boxes must match.',
  changed: 'Password changed. Use the new one next time you sign in.',
});

/** Wording on the App lock screen, where the PIN is created, changed and removed. */
export const APP_LOCK_MESSAGES = Object.freeze({
  explanation:
    'An app lock asks for a PIN every time the app opens on this phone, so a borrowed or stolen phone cannot show your tickets. It is optional, and it does not change how you sign in.',
  offTitle: 'App lock is off',
  offHint: 'Anyone who picks up this phone can open the app while you are signed in.',
  onTitle: 'App lock is on',
  createHeading: 'Choose a PIN',
  createAction: 'Turn on app lock',
  created: 'App lock is on. You will be asked for your PIN next time the app opens.',
  changeHeading: 'Change your PIN',
  changeAction: 'Save the new PIN',
  changed: 'Your PIN has been changed.',
  removeHeading: 'Turn off app lock',
  removeExplanation:
    'Your password is asked for rather than your PIN, so forgetting the PIN never locks you out of your own app.',
  removeAction: 'Turn off app lock',
  removed: 'App lock is off. The app will open without a PIN.',
  pinLabel: 'PIN',
  confirmPinLabel: 'Type the PIN again',
  currentPinLabel: 'Your PIN now',
  newPinLabel: 'New PIN',
  passwordLabel: 'Your password',
  pinTooShort: 'Enter all the digits of your PIN.',
  confirmMismatch: 'Both PIN boxes must match.',
  passwordRequired: 'Enter your password to confirm.',
  /** Why the digits cannot be shown back to the user, said plainly on the screen. */
  cannotShowPin:
    'Your PIN is stored scrambled, the same way your password is, so not even this screen can show it back to you. If you have forgotten it, turn the lock off with your password and choose a new PIN.',
});

/** Wording on the lock screen that covers the app until the PIN is typed. */
export const APP_LOCK_SCREEN = Object.freeze({
  title: 'Enter your PIN',
  subtitle: 'Your app lock is on, so the app asks for your PIN before it opens.',
  wrongPin: 'That is not your PIN.',
  signOutAction: 'Use my password instead',
  lockedOut: 'Too many wrong PINs. Sign in with your password to carry on.',
});

/** Wording on the password step of deleting an account. */
export const DELETE_ACCOUNT_PASSWORD = Object.freeze({
  title: 'Enter your password',
  explanation:
    'This removes your account and everything on it — tickets, wallet, saved routes and your inquiries. It cannot be undone.',
  label: 'Your password',
  confirmLabel: 'Delete my account for good',
  required: 'Enter your password to confirm.',
});
