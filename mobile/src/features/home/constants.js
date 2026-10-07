// Constants for the home feature (Member 04). Put values here instead of magic numbers/strings in screens.

/** The quick actions on each role's home screen. One place to add or reorder them. */
export const HOME_QUICK_ACTIONS = Object.freeze({
  driver: Object.freeze([
    {
      key: 'trip',
      label: 'My trip',
      hint: 'Start or end your run',
      iconName: 'play-circle-outline',
      route: '/(driver)/(tabs)/live',
      accessibilityLabel: 'My trip: start or end your run',
    },
    {
      key: 'delay',
      label: 'Report delay',
      hint: 'Tell passengers you are late',
      iconName: 'alert-circle-outline',
      route: '/(driver)/delay-report',
      accessibilityLabel: 'Report a delay to passengers',
    },
    {
      key: 'verify',
      label: 'Verify ticket',
      hint: 'Scan a passenger QR code',
      iconName: 'qr-code-outline',
      route: '/(driver)/(tabs)/scan',
      accessibilityLabel: 'Verify a passenger ticket',
    },
    {
      key: 'support',
      label: 'Support',
      hint: 'Ask the office a question',
      iconName: 'chatbubble-ellipses-outline',
      route: '/(driver)/inquiries',
      accessibilityLabel: 'Support: ask the office a question',
    },
  ]),
});
