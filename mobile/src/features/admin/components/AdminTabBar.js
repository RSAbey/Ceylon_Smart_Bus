// The admin navigation bar. It is deliberately not the passenger BottomTabBar: the web dashboard's
// navigation is a dark chrome sidebar, and carrying that chrome onto the phone is what tells an
// administrator at a glance that they are in the management app and not the passenger one. It also
// carries a count badge on Inquiries, which is the number an administrator actually works from.
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, sizes, spacing, typography } from '../../../theme';

/** Above this the badge reads "9+", so a long number cannot stretch the tab. */
const MAX_BADGE_COUNT = 9;
const TAB_MIN_WIDTH = 72;

/**
 * Formats the badge number.
 * @param {number} badgeCount - How many items are waiting.
 * @returns {string} The number, or "9+".
 */
function formatBadgeCount(badgeCount) {
  return badgeCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(badgeCount);
}

/**
 * One tab in the admin bar.
 * @param {object} props - Component props.
 * @param {string} props.tabLabel - Visible label.
 * @param {string} props.iconName - Ionicons name.
 * @param {boolean} props.isActive - Whether this is the open tab.
 * @param {number} props.badgeCount - Items waiting; 0 hides the badge.
 * @param {Function} props.onPress - Opens the tab.
 * @returns {import('react').JSX.Element} The tab.
 */
function AdminTabButton({ tabLabel, iconName, isActive, badgeCount, onPress }) {
  const tabColor = isActive ? colors.secondary[400] : colors.chrome.muted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={
        badgeCount > 0 ? `${tabLabel}, ${badgeCount} waiting` : tabLabel
      }
      accessibilityState={{ selected: isActive }}
      style={styles.tabButton}
    >
      {({ pressed }) => (
        <View style={[styles.tabContent, pressed && styles.tabContentPressed]}>
          {isActive && <View style={styles.activeIndicator} />}
          <View>
            <Ionicons name={iconName} size={sizes.iconLarge} color={tabColor} />
            {badgeCount > 0 && (
              <View style={styles.badge}>
                <Text style={[typography.caption, styles.badgeText]}>
                  {formatBadgeCount(badgeCount)}
                </Text>
              </View>
            )}
          </View>
          <Text style={[typography.caption, { color: tabColor }]} numberOfLines={1}>
            {tabLabel}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Custom tabBar for the admin <Tabs> navigator.
 * @param {object} props - Props from the Tabs navigator plus our configuration.
 * @param {object} props.state - Navigator state (routes and the active index).
 * @param {object} props.descriptors - Screen options per route; the title is the label.
 * @param {object} props.navigation - Navigator helpers.
 * @param {Object<string, string>} props.tabIconMap - Route name to Ionicons name.
 * @param {Object<string, number>} [props.tabBadgeCounts] - Route name to a count to badge.
 * @returns {import('react').JSX.Element} The bar.
 */
export default function AdminTabBar({
  state,
  descriptors,
  navigation,
  tabIconMap,
  tabBadgeCounts = {},
}) {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View
      style={[styles.tabBar, { paddingBottom: safeAreaInsets.bottom }]}
      accessibilityRole="tablist"
    >
      {/* Five tabs do not fit side by side on a narrow phone, so the bar scrolls sideways. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabStrip}
      >
        {state.routes.map((tabRoute, tabIndex) => {
          const isActive = state.index === tabIndex;
          const openTab = () => {
            const tabPressEvent = navigation.emit({
              type: 'tabPress',
              target: tabRoute.key,
              canPreventDefault: true,
            });
            if (!isActive && !tabPressEvent.defaultPrevented) navigation.navigate(tabRoute.name);
          };
          return (
            <AdminTabButton
              key={tabRoute.key}
              tabLabel={descriptors[tabRoute.key].options.title || tabRoute.name}
              iconName={tabIconMap[tabRoute.name]}
              isActive={isActive}
              badgeCount={tabBadgeCounts[tabRoute.name] || 0}
              onPress={openTab}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.chrome.base,
    borderTopWidth: sizes.borderThin,
    borderTopColor: colors.chrome.border,
  },
  tabStrip: {
    flexGrow: 1,
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
    minWidth: TAB_MIN_WIDTH,
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
    backgroundColor: colors.chrome.raised,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: sizes.activeIndicatorWidth,
    height: sizes.activeIndicatorHeight,
    borderRadius: radii.sm,
    backgroundColor: colors.secondary[400],
  },
  badge: {
    position: 'absolute',
    top: -spacing.xs,
    left: sizes.iconMedium,
    minWidth: sizes.iconMedium,
    paddingHorizontal: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary[500],
    alignItems: 'center',
  },
  badgeText: {
    color: colors.text.onColor,
  },
});
