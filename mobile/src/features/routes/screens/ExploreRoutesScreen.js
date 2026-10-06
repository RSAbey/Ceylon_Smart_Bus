// Search Routes screen (Member 02, FR-04): pick From and To, see matching routes, keep recent searches.
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import { useDrawer } from '../../../components/navigation/DrawerContext';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import {
  clearRecentSearches,
  fetchRecentSearches,
  fetchStopNames,
  recordRecentSearch,
  searchRoutes,
} from '../services/routeApi';
import { SEARCH_MESSAGES } from '../constants';

/**
 * A simple picker sheet, since the design shows a dropdown rather than free text.
 * @param {object} props - Component props.
 * @param {boolean} props.isVisible - Whether the sheet is open.
 * @param {string} props.title - What is being chosen.
 * @param {string[]} props.stopNames - Options to show.
 * @param {Function} props.onChoose - Called with the chosen stop name.
 * @param {Function} props.onClose - Closes the sheet.
 * @returns {import('react').JSX.Element} The picker.
 */
function StopPicker({ isVisible, title, stopNames, onChoose, onClose }) {
  return (
    <Modal transparent visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.pickerBackdrop} onPress={onClose} accessibilityLabel="Close picker">
        <Pressable style={styles.pickerSheet} onPress={() => {}}>
          <Text style={[typography.heading3, styles.pickerTitle]}>{title}</Text>
          <ScrollView>
            {stopNames.map((stopName) => (
              <Pressable
                key={stopName}
                onPress={() => onChoose(stopName)}
                accessibilityRole="button"
                accessibilityLabel={stopName}
                style={({ pressed }) => [styles.pickerRow, pressed && styles.pickerRowPressed]}
              >
                <Ionicons name="location-outline" size={sizes.iconMedium} color={colors.text.secondary} />
                <Text style={typography.bodyLarge}>{stopName}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Route search. Searching stores the journey so it appears under Recent searches next time.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function ExploreRoutesScreen() {
  const router = useRouter();
  const drawer = useDrawer();

  const [stopNames, setStopNames] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [originStop, setOriginStop] = useState('');
  const [destinationStop, setDestinationStop] = useState('');
  const [openPicker, setOpenPicker] = useState(null);

  const [matchingRoutes, setMatchingRoutes] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadScreen = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    Promise.all([fetchStopNames(), fetchRecentSearches()])
      .then(([loadedStopNames, loadedRecentSearches]) => {
        if (!isEffectActive) return;
        setStopNames(loadedStopNames);
        setRecentSearches(loadedRecentSearches);
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

  const runSearch = async (fromStop, toStop) => {
    if (!toStop) {
      setFormErrorMessage(SEARCH_MESSAGES.destinationRequired);
      return;
    }
    if (fromStop && fromStop === toStop) {
      setFormErrorMessage(SEARCH_MESSAGES.sameStops);
      return;
    }
    setFormErrorMessage('');
    setIsSearching(true);
    try {
      const foundRoutes = await searchRoutes({ from: fromStop || undefined, to: toStop });
      setMatchingRoutes(foundRoutes);
      await recordRecentSearch({ originText: fromStop || undefined, destinationText: toStop });
      setRecentSearches(await fetchRecentSearches());
    } catch (searchError) {
      setFormErrorMessage(searchError.message);
    } finally {
      setIsSearching(false);
    }
  };

  const clearAllSearches = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  if (isLoading) {
    return (
      <ScreenContainer header={<AppHeader variant="back" title="Search Routes" />}>
        <LoadingState message="Loading stops..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={<AppHeader variant="back" title="Search Routes" />}>
        <ErrorState message={loadErrorMessage} onRetry={reloadScreen} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      isScrollable
      header={
        <AppHeader
          variant="back"
          title="Search Routes"
          onBackPress={router.canGoBack() ? router.back : undefined}
          onMenuPress={drawer ? drawer.openDrawer : undefined}
        />
      }
    >
      <View style={styles.fieldBlock}>
        <Text style={[typography.label, styles.mutedText]}>From</Text>
        <Pressable
          onPress={() => setOpenPicker('from')}
          accessibilityRole="button"
          accessibilityLabel={`Travelling from ${originStop || 'any stop'}. Tap to change.`}
          style={styles.selectField}
        >
          <Text style={[typography.bodyLarge, !originStop && styles.placeholderText]}>
            {originStop || 'Any stop'}
          </Text>
          <Ionicons name="chevron-down" size={sizes.iconMedium} color={colors.text.secondary} />
        </Pressable>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={[typography.label, styles.mutedText]}>To</Text>
        <Pressable
          onPress={() => setOpenPicker('to')}
          accessibilityRole="button"
          accessibilityLabel={`Travelling to ${destinationStop || 'nowhere chosen'}. Tap to change.`}
          style={styles.selectField}
        >
          <Text style={[typography.bodyLarge, !destinationStop && styles.placeholderText]}>
            {destinationStop || 'Choose destination'}
          </Text>
          <Ionicons name="chevron-down" size={sizes.iconMedium} color={colors.text.secondary} />
        </Pressable>
      </View>

      {Boolean(formErrorMessage) && (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={sizes.iconMedium} color={colors.error.dark} />
          <Text style={[typography.bodyMedium, styles.errorText]}>{formErrorMessage}</Text>
        </View>
      )}

      <AppButton
        label="Search Routes"
        size="large"
        isFullWidth
        isLoading={isSearching}
        onPress={() => runSearch(originStop, destinationStop)}
      />

      {matchingRoutes !== null && (
        <View style={styles.resultBlock}>
          <Text style={[typography.sectionHeading, styles.mutedText]}>Results</Text>
          {matchingRoutes.length === 0 ? (
            <EmptyState
              iconName="bus-outline"
              title="No matching route"
              message={SEARCH_MESSAGES.noResults}
            />
          ) : (
            matchingRoutes.map((matchingRoute) => (
              <AppCard
                key={matchingRoute.route.id}
                onPress={() => router.push(`/(passenger)/route-details/${matchingRoute.route.id}`)}
                accessibilityLabel={`Route ${matchingRoute.route.routeNumber}, ${matchingRoute.route.origin} to ${matchingRoute.route.destination}`}
              >
                <View style={styles.resultRow}>
                  <View style={styles.routeBadge}>
                    <Text style={[typography.heading3, styles.routeBadgeText]}>
                      {matchingRoute.route.routeNumber}
                    </Text>
                  </View>
                  <View style={styles.resultTextBlock}>
                    <Text style={typography.bodyLarge}>
                      {matchingRoute.route.origin} → {matchingRoute.route.destination}
                    </Text>
                    {matchingRoute.fareAmount !== undefined && (
                      <Text style={[typography.bodySmall, styles.mutedText]}>
                        Fare Rs. {matchingRoute.fareAmount} · {matchingRoute.stopCount} stops
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={sizes.iconMedium} color={colors.text.disabled} />
                </View>
              </AppCard>
            ))
          )}
        </View>
      )}

      <View style={styles.recentHeaderRow}>
        <Text style={[typography.sectionHeading, styles.mutedText]}>Recent searches</Text>
        {recentSearches.length > 0 && (
          <AppButton label="Clear all" variant="text" size="small" onPress={clearAllSearches} />
        )}
      </View>
      {recentSearches.length === 0 ? (
        <Text style={[typography.bodySmall, styles.mutedText]}>
          Searching for routes helps you find real-time bus schedules and locations.
        </Text>
      ) : (
        <AppCard style={styles.recentCard}>
          {recentSearches.map((recentSearch, searchIndex) => (
            <View key={recentSearch.id}>
              {searchIndex > 0 && <View style={styles.rowDivider} />}
              <Pressable
                onPress={() => {
                  setOriginStop(recentSearch.originText || '');
                  setDestinationStop(recentSearch.destinationText);
                  runSearch(recentSearch.originText || '', recentSearch.destinationText);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Search ${recentSearch.originText || 'any stop'} to ${recentSearch.destinationText} again`}
                style={({ pressed }) => [styles.recentRow, pressed && styles.pickerRowPressed]}
              >
                <Text style={typography.bodyLarge}>
                  {recentSearch.originText || 'Any stop'} → {recentSearch.destinationText}
                </Text>
                <Ionicons name="chevron-forward" size={sizes.iconMedium} color={colors.text.disabled} />
              </Pressable>
            </View>
          ))}
        </AppCard>
      )}

      <StopPicker
        isVisible={openPicker !== null}
        title={openPicker === 'from' ? 'Travelling from' : 'Travelling to'}
        stopNames={stopNames}
        onChoose={(stopName) => {
          if (openPicker === 'from') setOriginStop(stopName);
          else setDestinationStop(stopName);
          setOpenPicker(null);
        }}
        onClose={() => setOpenPicker(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    gap: spacing.xs,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  placeholderText: {
    color: colors.text.disabled,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_TARGET + spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.error.light,
  },
  errorText: {
    flex: 1,
    color: colors.error.dark,
  },
  resultBlock: {
    gap: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  routeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
  },
  routeBadgeText: {
    color: colors.primary[600],
  },
  resultTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentCard: {
    padding: spacing.xs,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  rowDivider: {
    height: sizes.borderThin,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
  },
  pickerTitle: {
    marginBottom: spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  pickerRowPressed: {
    backgroundColor: colors.primary[100],
  },
});
