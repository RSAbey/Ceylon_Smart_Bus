// My Routes (Member 02, screens 15 and 16): saved routes with Track and Details, plus an empty state.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import { useToast } from '../../../components/ui/ToastMessage';
import { useDrawer } from '../../../components/navigation/DrawerContext';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchSavedRoutes, removeSavedRoute } from '../services/routeApi';
import { SAVED_ROUTES_EMPTY } from '../constants';

/**
 * Saved routes list. Track opens live tracking when a bus is running; Details always opens the route.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function SavedRoutesScreen() {
  const router = useRouter();
  const drawer = useDrawer();
  const { showSuccessToast, showErrorToast } = useToast();

  const [savedRoutes, setSavedRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [routePendingRemoval, setRoutePendingRemoval] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadSavedRoutes = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  // Saving happens on the Route Details screen, so refresh whenever this screen comes back into view.
  useFocusEffect(reloadSavedRoutes);

  useEffect(() => {
    let isEffectActive = true;
    fetchSavedRoutes()
      .then((loadedRoutes) => {
        if (!isEffectActive) return;
        setSavedRoutes(loadedRoutes);
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

  const confirmRemove = async () => {
    setIsRemoving(true);
    try {
      await removeSavedRoute(routePendingRemoval.id);
      showSuccessToast('Route removed.');
      setRoutePendingRemoval(null);
      reloadSavedRoutes();
    } catch (removeError) {
      showErrorToast(removeError.message);
    } finally {
      setIsRemoving(false);
    }
  };

  const screenHeader = (
    <AppHeader
      variant="back"
      title="My Routes"
      onBackPress={router.canGoBack() ? router.back : undefined}
      onMenuPress={drawer ? drawer.openDrawer : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your routes..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadSavedRoutes} />
      </ScreenContainer>
    );
  }
  if (savedRoutes.length === 0) {
    return (
      <ScreenContainer header={screenHeader}>
        <EmptyState
          iconName="bus-outline"
          title={SAVED_ROUTES_EMPTY.title}
          message={SAVED_ROUTES_EMPTY.message}
          actionLabel={SAVED_ROUTES_EMPTY.actionLabel}
          onActionPress={() => router.push('/(passenger)/(tabs)/explore')}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <View style={styles.headerRow}>
        <Text style={[typography.sectionHeading, styles.mutedText]}>
          {savedRoutes.length} saved {savedRoutes.length === 1 ? 'route' : 'routes'}
        </Text>
        <AppButton
          label="Add"
          variant="outline"
          size="small"
          iconName="add"
          onPress={() => router.push('/(passenger)/(tabs)/explore')}
        />
      </View>

      {savedRoutes.map((savedRoute) => (
        <AppCard key={savedRoute.id}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.routeBadge}>
              <Ionicons name="bus" size={sizes.iconMedium} color={colors.primary[600]} />
            </View>
            <Text style={[typography.heading2, styles.routeNumberText]}>
              {savedRoute.route?.routeNumber}
            </Text>
            <AppButton
              label="Remove"
              variant="text"
              size="small"
              iconName="ellipsis-vertical"
              accessibilityLabel={`Remove route ${savedRoute.route?.routeNumber} from saved routes`}
              onPress={() => setRoutePendingRemoval(savedRoute)}
            />
          </View>

          <Text style={typography.bodyLarge}>
            {savedRoute.route?.origin} → {savedRoute.route?.destination}
          </Text>
          <View style={styles.statusRow}>
            <Ionicons
              name={savedRoute.hasRunningBus ? 'time-outline' : 'moon-outline'}
              size={sizes.iconSmall}
              color={colors.text.secondary}
            />
            <Text style={[typography.bodySmall, styles.mutedText]}>
              {savedRoute.hasRunningBus
                ? `${savedRoute.runningTripIds.length} bus running now · ${savedRoute.stopCount} stops`
                : `No bus running · ${savedRoute.stopCount} stops`}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <AppButton
              label="Track"
              isFullWidth
              isDisabled={!savedRoute.hasRunningBus}
              style={styles.actionButton}
              onPress={() => router.push(`/(passenger)/live-tracking/${savedRoute.runningTripIds[0]}`)}
            />
            <AppButton
              label="Details"
              variant="outline"
              isFullWidth
              style={styles.actionButton}
              onPress={() => router.push(`/(passenger)/route-details/${savedRoute.route?.id}`)}
            />
          </View>
        </AppCard>
      ))}

      <ConfirmDialog
        isVisible={Boolean(routePendingRemoval)}
        title="Remove this route?"
        message={`Route ${routePendingRemoval?.route?.routeNumber} will no longer appear in your saved routes.`}
        confirmLabel="Remove"
        isDestructive
        isConfirming={isRemoving}
        onConfirm={confirmRemove}
        onCancel={() => setRoutePendingRemoval(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mutedText: {
    color: colors.text.secondary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  routeBadge: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeNumberText: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});
