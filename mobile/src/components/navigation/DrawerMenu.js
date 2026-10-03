// Slide-in passenger menu (Navigation Components PNG): brand, profile block, menu items, separate destructive Logout.
import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MIN_TOUCH_TARGET, colors, durations, radii, sizes, spacing, typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { LOGIN_ROUTE } from '../../utils/constants';
import { getNameInitials } from '../../utils/formatters';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useDrawer } from './DrawerContext';
import { DRAWER_MENU_ITEMS, DRAWER_PROFILE_ROUTE } from './drawerMenuItems';

const BRAND_TAGLINE = 'Move smarter, every day';
const OPEN_OFFSET = 0;
const CLOSED_OFFSET = -sizes.drawerWidth;

/**
 * One drawer row; the selected row uses Primary 100 background + Primary 600 text (as in the design).
 * @param {object} props - Component props.
 * @param {string} props.label - Row text.
 * @param {string} props.iconName - Ionicons name.
 * @param {boolean} [props.isSelected] - Current screen.
 * @param {boolean} [props.isDestructive] - Red logout style.
 * @param {Function} props.onPress - Tap handler.
 * @returns {import('react').JSX.Element} Menu row.
 */
function DrawerRow({ label, iconName, isSelected = false, isDestructive = false, onPress }) {
  const rowColor = isDestructive ? colors.error.dark : isSelected ? colors.primary[600] : colors.text.primary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }) => [
        styles.menuRow,
        isSelected && styles.menuRowSelected,
        isDestructive && pressed && styles.menuRowDestructivePressed,
        !isDestructive && pressed && styles.menuRowSelected,
      ]}
    >
      <Ionicons name={iconName} size={sizes.iconMedium} color={rowColor} />
      <Text style={[typography.bodyMedium, { color: rowColor }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * The drawer itself; rendered once in the passenger layout and opened through useDrawer().openDrawer.
 * @returns {import('react').JSX.Element} Drawer modal.
 */
export default function DrawerMenu() {
  const { isDrawerOpen, closeDrawer } = useDrawer();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const safeAreaInsets = useSafeAreaInsets();
  const [drawerOffset] = useState(() => new Animated.Value(CLOSED_OFFSET));
  const [isLogoutDialogVisible, setIsLogoutDialogVisible] = useState(false);

  useEffect(() => {
    Animated.timing(drawerOffset, {
      toValue: isDrawerOpen ? OPEN_OFFSET : CLOSED_OFFSET,
      duration: durations.normal,
      useNativeDriver: true,
    }).start();
  }, [isDrawerOpen, drawerOffset]);

  const openMenuRoute = (menuRoute) => {
    closeDrawer();
    router.push(menuRoute);
  };

  const confirmLogout = async () => {
    setIsLogoutDialogVisible(false);
    closeDrawer();
    await signOut();
    router.replace(LOGIN_ROUTE);
  };

  return (
    <Modal transparent visible={isDrawerOpen} animationType="fade" onRequestClose={closeDrawer}>
      <View style={styles.modalRoot}>
        <Animated.View
          style={[
            styles.drawerPanel,
            { paddingTop: safeAreaInsets.top, paddingBottom: safeAreaInsets.bottom, transform: [{ translateX: drawerOffset }] },
          ]}
          accessibilityViewIsModal
        >
          <View style={styles.brandBlock}>
            <Text style={[typography.heading3, styles.brandTitle]}>Ceylon Smart Bus</Text>
            <Text style={[typography.caption, styles.mutedText]}>{BRAND_TAGLINE}</Text>
            <Pressable
              onPress={() => openMenuRoute(DRAWER_PROFILE_ROUTE)}
              accessibilityRole="button"
              accessibilityLabel="View profile"
              style={styles.profileBlock}
            >
              <View style={styles.avatarCircle}>
                <Text style={[typography.caption, styles.avatarText]}>{getNameInitials(user?.fullName)}</Text>
              </View>
              <View>
                <Text style={[typography.bodyMedium, styles.brandTitle]}>{user?.fullName}</Text>
                <Text style={[typography.caption, styles.mutedText]}>View profile</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.menuList}>
            {DRAWER_MENU_ITEMS.map((menuItem) => (
              <DrawerRow
                key={menuItem.key}
                label={menuItem.label}
                iconName={menuItem.iconName}
                isSelected={pathname === menuItem.activePath || pathname.startsWith(`${menuItem.activePath}/`)}
                onPress={() => openMenuRoute(menuItem.route)}
              />
            ))}
            <DrawerRow
              label="Logout"
              iconName="log-out-outline"
              isDestructive
              onPress={() => setIsLogoutDialogVisible(true)}
            />
          </View>
        </Animated.View>
        <Pressable style={styles.backdrop} onPress={closeDrawer} accessibilityLabel="Close menu" />
      </View>

      <ConfirmDialog
        isVisible={isLogoutDialogVisible}
        title="Log out?"
        message="You will need to sign in again to see your tickets and alerts."
        confirmLabel="Logout"
        isDestructive
        onConfirm={confirmLogout}
        onCancel={() => setIsLogoutDialogVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  drawerPanel: {
    width: sizes.drawerWidth,
    backgroundColor: colors.surface,
  },
  brandBlock: {
    padding: spacing.lg,
    gap: spacing.xs,
    borderBottomWidth: sizes.borderThin,
    borderBottomColor: colors.border,
  },
  brandTitle: {
    color: colors.text.primary,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    minHeight: MIN_TOUCH_TARGET,
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
  menuList: {
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  menuRowSelected: {
    backgroundColor: colors.primary[100],
  },
  menuRowDestructivePressed: {
    backgroundColor: colors.error.light,
  },
});
