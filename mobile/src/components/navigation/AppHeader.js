// App header from the Navigation Components PNG: 64 px bar, 16 px insets, one leading pattern, max two trailing actions.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../theme';
import { getNameInitials } from '../../utils/formatters';

const BRAND_TITLE = 'Ceylon Smart Bus';

/**
 * Round 44 px icon button used for every header action.
 * @param {object} props - Component props.
 * @param {string} props.iconName - Ionicons name.
 * @param {string} props.accessibilityLabel - What the action does.
 * @param {Function} props.onPress - Tap handler.
 * @param {boolean} [props.hasUnreadDot] - Shows the orange unread dot (bell only).
 * @returns {import('react').JSX.Element} Icon button.
 */
function HeaderIconButton({ iconName, accessibilityLabel, onPress, hasUnreadDot = false }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
    >
      <Ionicons name={iconName} size={sizes.iconLarge} color={colors.text.primary} />
      {hasUnreadDot && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

/**
 * Picks the trailing actions (max two) for the chosen variant.
 * @param {object} headerProps - Props given to AppHeader.
 * @returns {Array<object>} Trailing action descriptors.
 */
function buildTrailingActions(headerProps) {
  const { variant, onMenuPress, onSearchPress, onMorePress, onAlertsPress, unreadAlertCount } = headerProps;
  const trailingActions = {
    standard: [
      onAlertsPress && {
        key: 'alerts',
        iconName: 'notifications-outline',
        accessibilityLabel: unreadAlertCount > 0 ? `Alerts, ${unreadAlertCount} unread` : 'Alerts',
        onPress: onAlertsPress,
        hasUnreadDot: unreadAlertCount > 0,
      },
    ],
    back: [onMenuPress && { key: 'menu', iconName: 'menu', accessibilityLabel: 'Open menu', onPress: onMenuPress }],
    search: [onSearchPress && { key: 'search', iconName: 'search', accessibilityLabel: 'Search', onPress: onSearchPress }],
    tracking: [
      onMorePress && { key: 'more', iconName: 'ellipsis-vertical', accessibilityLabel: 'More options', onPress: onMorePress },
    ],
  };
  return (trailingActions[variant] || []).filter(Boolean);
}

/**
 * Screen header. Pick a variant instead of building a new header.
 * @param {object} props - Component props.
 * @param {'standard'|'back'|'search'|'tracking'} [props.variant] - Layout from the design.
 * @param {string} [props.title] - Title text (standard defaults to the brand name).
 * @param {Function} [props.onBackPress] - Leading back arrow (back/search variants); hidden when absent.
 * @param {Function} [props.onMenuPress] - Trailing menu icon (back variant).
 * @param {Function} [props.onSearchPress] - Trailing search icon (search variant).
 * @param {Function} [props.onMorePress] - Trailing "more" icon (tracking variant).
 * @param {Function} [props.onAlertsPress] - Bell icon (standard variant).
 * @param {Function} [props.onProfilePress] - Avatar button (standard variant).
 * @param {number} [props.unreadAlertCount] - Shows the unread dot on the bell when above 0.
 * @param {string} [props.userFullName] - Used for the avatar initials.
 * @returns {import('react').JSX.Element} The header.
 */
export default function AppHeader(props) {
  const { variant = 'standard', title, onBackPress, onProfilePress, userFullName } = props;
  const headerTitle = title || BRAND_TITLE;
  const hasBackButton = (variant === 'back' || variant === 'search') && Boolean(onBackPress);
  const trailingActions = buildTrailingActions(props);

  return (
    <View style={styles.headerBar} accessibilityRole="header">
      {hasBackButton && <HeaderIconButton iconName="arrow-back" accessibilityLabel="Go back" onPress={onBackPress} />}
      <Text style={[typography.heading3, styles.titleText]} numberOfLines={1}>
        {headerTitle}
      </Text>
      {trailingActions.map((trailingAction) => (
        <HeaderIconButton
          key={trailingAction.key}
          iconName={trailingAction.iconName}
          accessibilityLabel={trailingAction.accessibilityLabel}
          onPress={trailingAction.onPress}
          hasUnreadDot={trailingAction.hasUnreadDot}
        />
      ))}
      {variant === 'standard' && Boolean(onProfilePress) && (
        <Pressable
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          style={styles.iconButton}
        >
          <View style={styles.avatarCircle}>
            <Text style={[typography.caption, styles.avatarText]}>{getNameInitials(userFullName)}</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.screenGutter,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: sizes.borderThin,
    borderBottomColor: colors.border,
  },
  titleText: {
    flex: 1,
    color: colors.text.primary,
  },
  iconButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  iconButtonPressed: {
    backgroundColor: colors.primary[100],
  },
  unreadDot: {
    position: 'absolute',
    bottom: spacing.sm,
    width: sizes.unreadDot,
    height: sizes.unreadDot,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary[500],
  },
  avatarCircle: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.pill,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary[600],
  },
});
