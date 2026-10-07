// Driver Profile (driver app): who the driver is, the documents they were registered with, the bus
// they drive and how many runs they have completed.
// Every figure here is read from the data model. Ratings, earnings and emergency contacts are in
// the Figma design but have no table behind them, so they are left out rather than faked
// (recorded in docs/evidence/m01/deviations.md).
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import StatusBadge from '../../../components/ui/StatusBadge';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useAuth } from '../../../context/AuthContext';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { getNameInitials } from '../../../utils/formatters';
import { fetchDriverProfile } from '../services/profileApi';
import { DRIVER_PROFILE_SECTIONS } from '../constants';

/**
 * One tappable settings row.
 * @param {object} props - Component props.
 * @param {string} props.iconName - Ionicons name.
 * @param {string} props.label - Row title.
 * @param {string} props.hint - Supporting line under the title.
 * @param {Function} [props.onPress] - Opens the row; omitted makes the row read-only.
 * @returns {import('react').JSX.Element} The row.
 */
function SettingsRow({ iconName, label, hint, onPress }) {
  const rowContent = (
    <>
      <View style={styles.rowBadge}>
        <Ionicons name={iconName} size={sizes.iconMedium} color={colors.primary[600]} />
      </View>
      <View style={styles.rowTextBlock}>
        <Text style={typography.bodyLarge}>{label}</Text>
        <Text style={[typography.caption, styles.mutedText]}>{hint}</Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={sizes.iconMedium} color={colors.text.secondary} />
      )}
    </>
  );

  if (!onPress) {
    return <View style={styles.settingsRow}>{rowContent}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${hint}`}
      style={styles.settingsRow}
    >
      {rowContent}
    </Pressable>
  );
}

/**
 * The driver's profile screen.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function DriverProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const [driverProfile, setDriverProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isSignOutDialogVisible, setIsSignOutDialogVisible] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadProfile = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  // The driver may have just edited their details, so re-read when the screen comes back into view.
  useFocusEffect(reloadProfile);

  useEffect(() => {
    let isEffectActive = true;
    fetchDriverProfile()
      .then((loadedProfile) => {
        if (!isEffectActive) return;
        setDriverProfile(loadedProfile);
        setLoadErrorMessage('');
      })
      .catch((loadError) => {
        if (isEffectActive) setLoadErrorMessage(loadError.message);
      })
      .finally(() => {
        if (isEffectActive) setIsLoading(false);
      });
    return () => {
      isEffectActive = false;
    };
  }, [reloadCounter]);

  const screenHeader = (
    <AppHeader
      variant="back"
      title="Driver Profile"
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your profile..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadProfile} />
      </ScreenContainer>
    );
  }

  const { account, bus, route, licenseNumber, nic, completedTripCount, isTripRunning } =
    driverProfile;

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard>
        <View style={styles.identityRow}>
          <View style={styles.avatarCircle}>
            <Text style={[typography.heading3, styles.avatarText]}>
              {getNameInitials(account?.fullName)}
            </Text>
          </View>
          <View style={styles.identityTextBlock}>
            <Text style={typography.heading2}>{account?.fullName}</Text>
            <Text style={[typography.bodySmall, styles.mutedText]}>
              {completedTripCount} {completedTripCount === 1 ? 'trip' : 'trips'} completed
            </Text>
          </View>
          <StatusBadge
            status={isTripRunning ? 'active' : 'cancelled'}
            label={isTripRunning ? 'On duty' : 'Off duty'}
          />
        </View>
      </AppCard>

      <Text style={[typography.sectionHeading, styles.mutedText]}>
        {DRIVER_PROFILE_SECTIONS.account}
      </Text>
      <AppCard>
        <SettingsRow
          iconName="person-outline"
          label="Personal information"
          hint={`${account?.email} · ${account?.mobile}`}
          onPress={() => router.push('/(passenger)/edit-profile')}
        />
        <View style={styles.rowDivider} />
        <SettingsRow
          iconName="bus-outline"
          label="Vehicle details"
          hint={
            bus
              ? `${bus.busName} · ${bus.plateNumber} · ${bus.capacity} seats`
              : 'No bus assigned yet'
          }
        />
        <View style={styles.rowDivider} />
        <SettingsRow
          iconName="document-text-outline"
          label="Documents"
          hint={`Licence ${licenseNumber} · NIC ${nic}`}
        />
        <View style={styles.rowDivider} />
        <SettingsRow
          iconName="git-network-outline"
          label="Assigned route"
          hint={
            route
              ? `Route ${route.routeNumber} · ${route.origin} → ${route.destination}`
              : 'No route assigned yet'
          }
          onPress={route ? () => router.push('/(driver)/(tabs)/route') : undefined}
        />
        <View style={styles.rowDivider} />
        <SettingsRow
          iconName="receipt-outline"
          label="Shift totals"
          hint="What you have collected today"
          onPress={() => router.push('/(driver)/shift')}
        />
      </AppCard>

      <View style={styles.noticeRow}>
        <Ionicons
          name="information-circle-outline"
          size={sizes.iconMedium}
          color={colors.information.dark}
        />
        <Text style={[typography.caption, styles.noticeText]}>
          Your licence, NIC and assigned bus are set by an administrator. Ask the office if any of
          these are wrong.
        </Text>
      </View>

      <Text style={[typography.sectionHeading, styles.mutedText]}>
        {DRIVER_PROFILE_SECTIONS.safety}
      </Text>
      <AppCard>
        <SettingsRow
          iconName="chatbubble-ellipses-outline"
          label="Support"
          hint="Ask the office a question"
          onPress={() => router.push('/(driver)/inquiries')}
        />
        <View style={styles.rowDivider} />
        <SettingsRow
          iconName="time-outline"
          label="Delay history"
          hint="Delays you have reported"
          onPress={() => router.push('/(driver)/delay-history')}
        />
        <View style={styles.rowDivider} />
        <SettingsRow
          iconName="document-outline"
          label="Terms of service"
          hint="View platform terms"
          onPress={() => router.push('/(passenger)/legal/terms')}
        />
        <View style={styles.rowDivider} />
        <SettingsRow
          iconName="shield-checkmark-outline"
          label="Privacy policy"
          hint="How your data is processed"
          onPress={() => router.push('/(passenger)/legal/privacy')}
        />
      </AppCard>

      <AppButton
        label="Log out"
        variant="error"
        size="large"
        isFullWidth
        iconName="log-out-outline"
        onPress={() => setIsSignOutDialogVisible(true)}
      />

      <Text style={[typography.caption, styles.versionText]}>
        Ceylon Smart Bus {Constants.expoConfig?.version || ''}
      </Text>

      <ConfirmDialog
        isVisible={isSignOutDialogVisible}
        title="Log out?"
        message={
          isTripRunning
            ? 'You are on a trip. End it first so passengers stop seeing this bus on the live map.'
            : 'You will need to sign in again to start your next shift.'
        }
        confirmLabel="Log out"
        isDestructive
        onConfirm={signOut}
        onCancel={() => setIsSignOutDialogVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
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
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.sm,
  },
  rowBadge: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowDivider: {
    height: sizes.borderThin,
    backgroundColor: colors.border,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.information.light,
  },
  noticeText: {
    flex: 1,
    color: colors.information.dark,
  },
  versionText: {
    color: colors.text.disabled,
    textAlign: 'center',
  },
});
