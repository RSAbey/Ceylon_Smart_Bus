// Config-driven bottom tab bar (Navigation Components PNG): icon + label, active indicator, pressed, disabled, unread dot.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, sizes, spacing, typography } from '../../theme';

/**
 * One tab button.
 * @param {object} props - Component props.
 * @param {string} props.tabLabel - Visible label.
 * @param {string} props.iconName - Ionicons name.
 * @param {boolean} props.isActive - Selected tab.
 * @param {boolean} props.isDisabled - Not available yet.
 * @param {boolean} props.hasUnreadDot - Show the orange dot (alerts tab).
 * @param {Function} props.onPress - Tap handler.
 * @returns {import('react').JSX.Element} Tab button.
 */
function TabButton({ tabLabel, iconName, isActive, isDisabled, hasUnreadDot, onPress }) {
  const tabColor = isDisabled ? colors.text.disabled : isActive ? colors.primary[600] : colors.text.secondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="tab"
      accessibilityLabel={hasUnreadDot ? `${tabLabel}, unread alerts` : tabLabel}
      accessibilityState={{ selected: isActive, disabled: isDisabled }}
      style={styles.tabButton}
    >
      {({ pressed }) => (
        <View style={[styles.tabContent, pressed && styles.tabContentPressed]}>
          {isActive && <View style={styles.activeIndicator} />}
          <Ionicons name={iconName} size={sizes.iconLarge} color={tabColor} />
          <Text style={[typography.caption, { color: tabColor }]} numberOfLines={1}>
            {tabLabel}
          </Text>
          {hasUnreadDot && <View style={styles.unreadDot} />}
        </View>
      )}
    </Pressable>
  );
}

/**
 * Custom tabBar for Expo Router <Tabs>. Passenger and driver layouts reuse it with different icon maps.
 * @param {object} props - Props from the Tabs navigator plus our configuration.
 * @param {object} props.state - Navigator state (routes + active index).
 * @param {object} props.descriptors - Screen options per route (title is the label).
 * @param {object} props.navigation - Navigator helpers.
 * @param {Object<string, string>} props.tabIconMap - Route name -> Ionicons name.
 * @param {number} [props.unreadAlertCount] - Unread notifications; shows the dot on the alerts tab.
 * @param {string} [props.alertTabName] - Route name of the alerts tab.
 * @param {string[]} [props.disabledTabNames] - Tabs shown in the disabled state.
 * @returns {import('react').JSX.Element} The tab bar.
 */
export default function BottomTabBar({
  state,
  descriptors,
  navigation,
  tabIconMap,
  unreadAlertCount = 0,
  alertTabName = 'alerts',
  disabledTabNames = [],
}) {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: safeAreaInsets.bottom }]} accessibilityRole="tablist">
      {state.routes.map((tabRoute, tabIndex) => {
        const isActive = state.index === tabIndex;
        const openTab = () => {
          const tabPressEvent = navigation.emit({ type: 'tabPress', target: tabRoute.key, canPreventDefault: true });
          if (!isActive && !tabPressEvent.defaultPrevented) navigation.navigate(tabRoute.name);
        };
        return (
          <TabButton
            key={tabRoute.key}
            tabLabel={descriptors[tabRoute.key].options.title || tabRoute.name}
            iconName={tabIconMap[tabRoute.name]}
            isActive={isActive}
            isDisabled={disabledTabNames.includes(tabRoute.name)}
            hasUnreadDot={tabRoute.name === alertTabName && unreadAlertCount > 0}
            onPress={openTab}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: sizes.borderThin,
    borderTopColor: colors.border,
  },
  tabButton: {
    flex: 1,
    minHeight: sizes.bottomTabHeight,
    padding: spacing.xs,
  },
  tabContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    borderRadius: radii.md,
  },
  tabContentPressed: {
    backgroundColor: colors.primary[100],
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: sizes.activeIndicatorWidth,
    height: sizes.activeIndicatorHeight,
    borderRadius: radii.sm,
    backgroundColor: colors.primary[600],
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.xs,
    right: '30%',
    width: sizes.unreadDot,
    height: sizes.unreadDot,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary[500],
  },
});
