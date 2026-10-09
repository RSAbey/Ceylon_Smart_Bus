// The administrator's own account on mobile. It is deliberately small: the dashboard's My Profile
// page edits the account and changes its password, and duplicating that on the phone would give two
// places to change one thing. What the phone does need is somewhere to see who is signed in and to
// sign out, which is what this is.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useAuth } from '../../../context/AuthContext';
import { getNameInitials } from '../../../utils/formatters';
import { LOGIN_ROUTE } from '../../../utils/constants';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { APP_VERSION_LABEL, LOGOUT_DIALOG } from '../../profile/constants';

/**
 * Admin account screen.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function AdminAccountScreen() {
  const router = useRouter();
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
    <ScreenContainer header={<AppHeader title="Account" />} isScrollable>
      <AppCard>
        <View style={styles.identityRow}>
          <View style={styles.avatarCircle}>
            <Text style={[typography.heading2, styles.avatarText]}>
              {getNameInitials(user?.fullName)}
            </Text>
          </View>
          <View style={styles.identityTextBlock}>
            <Text style={typography.heading2}>{user?.fullName}</Text>
            <Text style={[typography.bodySmall, styles.mutedText]}>{user?.email}</Text>
            <Text style={[typography.bodySmall, styles.mutedText]}>Administrator</Text>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <Text style={typography.sectionHeading}>What this app manages</Text>
        <Text style={[typography.bodyMedium, styles.mutedText]}>
          Notifications, inquiries, routes and transport data, the same records as the web dashboard
          and against the same API. Live tracking, finance and reporting stay on the dashboard, where
          there is room for a map and a chart.
        </Text>
      </AppCard>

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
  identityTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  versionText: {
    color: colors.text.disabled,
    textAlign: 'center',
  },
});
