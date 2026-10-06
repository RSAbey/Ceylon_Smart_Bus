// Profile & Account screen (Member 01): identity header, grouped settings rows and a destructive Log Out.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useDrawer } from '../../../components/navigation/DrawerContext';
import { useAuth } from '../../../context/AuthContext';
import { getNameInitials } from '../../../utils/formatters';
import { LOGIN_ROUTE } from '../../../utils/constants';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { APP_VERSION_LABEL, LOGOUT_DIALOG, PROFILE_SECTIONS } from '../constants';

/**
 * Formats the account creation date as "Member since October 2026".
 * @param {string} [createdAt] - ISO date the account was created.
 * @returns {string} Human-readable membership line.
 */
function formatMemberSince(createdAt) {
  if (!createdAt) return '';
  const joinedDate = new Date(createdAt);
  return `Member since ${joinedDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
}

/**
 * One tappable settings row with icon, label, description and a chevron.
 * @param {object} props - Component props.
 * @param {object} props.settingsRow - Entry from PROFILE_SECTIONS.
 * @param {Function} props.onPress - Opens the row's screen.
 * @returns {import('react').JSX.Element} The row.
 */
function ProfileSettingsRow({ settingsRow, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${settingsRow.label}. ${settingsRow.description}`}
      style={({ pressed }) => [styles.settingsRow, pressed && styles.settingsRowPressed]}
    >
      <View style={styles.rowIconCircle}>
        <Ionicons name={settingsRow.iconName} size={sizes.iconMedium} color={colors.primary[600]} />
      </View>
      <View style={styles.rowTextBlock}>
        <Text style={typography.bodyLarge}>{settingsRow.label}</Text>
        <Text style={[typography.bodySmall, styles.mutedText]}>{settingsRow.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={sizes.iconMedium} color={colors.text.disabled} />
    </Pressable>
  );
}

/**
 * Profile home. Personal information is editable; rows no member owns yet open a placeholder screen.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const drawer = useDrawer();
  const { user, signOut } = useAuth();
  const [isLogoutDialogVisible, setIsLogoutDialogVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const confirmSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsLogoutDialogVisible(false);
    setIsSigningOut(false);
    router.replace(LOGIN_ROUTE);
  };

  return (
    <ScreenContainer
      isScrollable
      header={
        <AppHeader
          variant="back"
          title="Profile & Account"
          onBackPress={router.canGoBack() ? router.back : undefined}
          onMenuPress={drawer ? drawer.openDrawer : undefined}
        />
      }
    >
      <AppCard>
        <View style={styles.identityRow}>
          <View style={styles.avatarCircle}>
            <Text style={[typography.heading2, styles.avatarText]}>{getNameInitials(user?.fullName)}</Text>
          </View>
          <View style={styles.rowTextBlock}>
            <Text style={typography.heading2}>{user?.fullName}</Text>
            <Text style={[typography.bodySmall, styles.mutedText]}>{formatMemberSince(user?.createdAt)}</Text>
          </View>
          <AppButton
            label="Edit"
            variant="outline"
            size="small"
            onPress={() => router.push('/(passenger)/edit-profile')}
          />
        </View>
      </AppCard>

      {PROFILE_SECTIONS.map((profileSection) => (
        <View key={profileSection.key} style={styles.sectionBlock}>
          <Text style={[typography.sectionHeading, styles.mutedText]}>{profileSection.title}</Text>
          <AppCard style={styles.sectionCard}>
            {profileSection.rows.map((settingsRow, rowIndex) => (
              <View key={settingsRow.key}>
                {rowIndex > 0 && <View style={styles.rowDivider} />}
                <ProfileSettingsRow settingsRow={settingsRow} onPress={() => router.push(settingsRow.route)} />
              </View>
            ))}
          </AppCard>
        </View>
      ))}

      <AppButton
        label="Log out"
        variant="error"
        iconName="log-out-outline"
        isFullWidth
        onPress={() => setIsLogoutDialogVisible(true)}
      />
      <Text style={[typography.caption, styles.versionText]}>{APP_VERSION_LABEL}</Text>

      <ConfirmDialog
        isVisible={isLogoutDialogVisible}
        title={LOGOUT_DIALOG.title}
        message={LOGOUT_DIALOG.message}
        confirmLabel={LOGOUT_DIALOG.confirmLabel}
        isDestructive
        isConfirming={isSigningOut}
        onConfirm={confirmSignOut}
        onCancel={() => setIsLogoutDialogVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: sizes.iconHuge,
    height: sizes.iconHuge,
    borderRadius: radii.pill,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary[600],
  },
  rowTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  sectionBlock: {
    gap: spacing.sm,
  },
  sectionCard: {
    padding: spacing.xs,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  settingsRowPressed: {
    backgroundColor: colors.primary[100],
  },
  rowIconCircle: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.pill,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: {
    height: sizes.borderThin,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  versionText: {
    color: colors.text.disabled,
    textAlign: 'center',
  },
});
