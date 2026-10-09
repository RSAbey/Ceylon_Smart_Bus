// Passenger Home (Member 04, Variant A "Search first"): plan a journey, quick actions and nearby buses.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useAuth } from '../../../context/AuthContext';
import useCurrentLocation from '../../../hooks/useCurrentLocation';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchPassengerHome } from '../services/homeApi';
import useUnreadNotificationCount from '../hooks/useUnreadNotificationCount';

/** The three shortcut tiles under "Quick actions". */
const QUICK_ACTIONS = [
  { key: 'search', label: 'Search', iconName: 'search', route: '/(passenger)/(tabs)/explore' },
  { key: 'track', label: 'Track bus', iconName: 'bus-outline', route: '/(passenger)/live-tracking' },
  { key: 'saved', label: 'Saved', iconName: 'star-outline', route: '/(passenger)/saved-routes' },
];

/**
 * Takes the first word of a name, for the "Hi, Kavindu" greeting.
 * @param {string} [fullName] - The passenger's full name.
 * @returns {string} First name.
 */
function getFirstName(fullName = '') {
  return fullName.trim().split(/\s+/)[0] || '';
}

/**
 * One nearby bus row: route number, journey and minutes away.
 * @param {object} props - Component props.
 * @param {object} props.nearbyBus - Entry from the home payload.
 * @param {Function} props.onPress - Opens live tracking for this bus.
 * @returns {import('react').JSX.Element} The row.
 */
function NearbyBusRow({ nearbyBus, onPress }) {
  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`Route ${nearbyBus.route?.routeNumber}, ${nearbyBus.route?.origin} to ${nearbyBus.route?.destination}, ${nearbyBus.distanceKm} kilometres away`}
      style={styles.nearbyCard}
    >
      <View style={styles.nearbyRow}>
        <View style={styles.tileIconCircle}>
          <Ionicons name="bus" size={sizes.iconLarge} color={colors.primary[600]} />
        </View>
        <View style={styles.nearbyTextBlock}>
          <Text style={typography.heading3}>Route {nearbyBus.route?.routeNumber}</Text>
          <Text style={[typography.bodySmall, styles.mutedText]}>
            {nearbyBus.route?.origin} → {nearbyBus.route?.destination}
          </Text>
          <Text style={[typography.bodySmall, styles.mutedText]}>Next service nearby</Text>
        </View>
        <View style={styles.nearbyDistanceBlock}>
          <Text style={[typography.heading3, styles.distanceText]}>{nearbyBus.distanceKm} km</Text>
          <Ionicons name="chevron-forward" size={sizes.iconMedium} color={colors.text.disabled} />
        </View>
      </View>
    </AppCard>
  );
}

/**
 * Home screen. One request fills the whole page so a bus and its arrival time stay within three taps (NFR-05).
 * @returns {import('react').JSX.Element} The screen.
 */
export default function PassengerHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const unreadAlertCount = useUnreadNotificationCount();
  const { position, isLocating, locationErrorMessage } = useCurrentLocation();

  const [homeDetails, setHomeDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadHome = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  // Saved routes and recent searches change on other screens, so refresh when Home comes back into view.
  useFocusEffect(reloadHome);

  useEffect(() => {
    // Wait for the location attempt to finish so the first call can include it.
    if (isLocating) return undefined;
    let isEffectActive = true;

    fetchPassengerHome(position || {})
      .then((loadedHome) => {
        if (!isEffectActive) return;
        setHomeDetails(loadedHome);
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
  }, [isLocating, position, reloadCounter]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading your journeys..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer>
        <ErrorState message={loadErrorMessage} onRetry={reloadHome} />
      </ScreenContainer>
    );
  }

  const nearbyBuses = homeDetails?.nearbyBuses || [];

  return (
    <ScreenContainer isScrollable>
      <View style={styles.greetingRow}>
        <View style={styles.greetingTextBlock}>
          <Text style={typography.display}>Hi, {getFirstName(homeDetails?.fullName || user?.fullName)}</Text>
          <Text style={[typography.bodyMedium, styles.mutedText]}>Where are you going today?</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(passenger)/(tabs)/alerts')}
          accessibilityRole="button"
          accessibilityLabel={
            unreadAlertCount > 0 ? `Alerts, ${unreadAlertCount} unread` : 'Alerts'
          }
          style={styles.bellButton}
        >
          <Ionicons name="notifications-outline" size={sizes.iconLarge} color={colors.text.primary} />
          {unreadAlertCount > 0 && <View style={styles.unreadDot} />}
        </Pressable>
      </View>

      <Text style={typography.heading2}>Plan your journey</Text>
      <AppCard>
        <View style={styles.planHeaderRow}>
          <View style={styles.tileIconCircle}>
            <Ionicons name="bus" size={sizes.iconLarge} color={colors.primary[600]} />
          </View>
          <View style={styles.nearbyTextBlock}>
            <Text style={typography.heading3}>Find your bus</Text>
            <Text style={[typography.bodySmall, styles.mutedText]}>Set your route and departure time</Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(passenger)/(tabs)/explore')}
          accessibilityRole="button"
          accessibilityLabel="Choose where you are travelling from and to"
          style={styles.journeyRow}
        >
          <View style={styles.journeyEnd}>
            <Ionicons name="location-outline" size={sizes.iconMedium} color={colors.primary[600]} />
            <View>
              <Text style={[typography.label, styles.mutedText]}>From</Text>
              <Text style={typography.bodyMedium}>Your location</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={sizes.iconMedium} color={colors.text.secondary} />
          <View style={styles.journeyEnd}>
            <Ionicons name="flag-outline" size={sizes.iconMedium} color={colors.secondary[600]} />
            <View>
              <Text style={[typography.label, styles.mutedText]}>To</Text>
              <Text style={typography.bodyMedium}>Destination</Text>
            </View>
          </View>
        </Pressable>

        <AppButton
          label="Find buses"
          size="large"
          isFullWidth
          onPress={() => router.push('/(passenger)/(tabs)/explore')}
        />
      </AppCard>

      <Text style={typography.heading2}>Quick actions</Text>
      <View style={styles.quickActionRow}>
        {QUICK_ACTIONS.map((quickAction) => (
          <Pressable
            key={quickAction.key}
            onPress={() => router.push(quickAction.route)}
            accessibilityRole="button"
            accessibilityLabel={quickAction.label}
            style={({ pressed }) => [styles.quickActionTile, pressed && styles.quickActionTilePressed]}
          >
            <View style={styles.tileIconCircle}>
              <Ionicons name={quickAction.iconName} size={sizes.iconLarge} color={colors.primary[600]} />
            </View>
            <Text style={typography.bodyMedium}>{quickAction.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={typography.heading2}>Nearby buses</Text>
      {nearbyBuses.length > 0 ? (
        nearbyBuses.map((nearbyBus) => (
          <NearbyBusRow
            key={nearbyBus.tripId}
            nearbyBus={nearbyBus}
            onPress={() => router.push(`/(passenger)/live-tracking/${nearbyBus.tripId}`)}
          />
        ))
      ) : (
        <AppCard>
          <View style={styles.emptyNearbyBlock}>
            <Ionicons name="navigate-outline" size={sizes.iconLarge} color={colors.text.disabled} />
            <Text style={[typography.bodyMedium, styles.mutedText]}>
              {locationErrorMessage || 'No buses are running near you right now.'}
            </Text>
          </View>
        </AppCard>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  greetingTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  bellButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: sizes.unreadDot,
    height: sizes.unreadDot,
    borderRadius: radii.pill,
    backgroundColor: colors.information.main,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  tileIconCircle: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
    marginBottom: spacing.lg,
  },
  journeyEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionTile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  quickActionTilePressed: {
    backgroundColor: colors.primary[100],
  },
  nearbyCard: {
    padding: spacing.md,
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nearbyTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  nearbyDistanceBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  distanceText: {
    color: colors.primary[600],
  },
  emptyNearbyBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
});
