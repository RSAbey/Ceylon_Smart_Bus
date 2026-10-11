// The stop name field with place suggestions, on the phone (Member 02, FR-03).
//
// The same idea as the dashboard's: typing a stop name lists matching places underneath, and
// choosing one fills in the latitude and longitude. It matters more here than on a desktop, because
// nobody is going to read coordinates off another app and retype them into a phone.
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppTextInput from '../../../components/ui/AppTextInput';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchPlaceSuggestions } from '../services/adminRouteApi';
import { ADMIN_MESSAGES, MIN_PLACE_QUERY_LENGTH, PLACE_SEARCH_DEBOUNCE_MS } from '../constants';

/**
 * A stop's name field, with the list of matching places under it.
 * @param {object} props - Component props.
 * @param {string} props.stopName - The name typed so far.
 * @param {string} [props.errorText] - Error for the name field.
 * @param {Function} props.onChangeName - Called with the typed text.
 * @param {Function} props.onChoosePlace - Called with the place that was chosen.
 * @returns {import('react').JSX.Element} The field and its suggestions.
 */
export default function StopPlaceField({ stopName, errorText, onChangeName, onChoosePlace }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  // What was last chosen. While the text still matches it there is nothing to search for, or
  // picking a place would immediately search for its own name again.
  const chosenNameRef = useRef('');

  useEffect(() => {
    const typedName = stopName.trim();
    if (typedName.length < MIN_PLACE_QUERY_LENGTH || typedName === chosenNameRef.current) {
      setSuggestions([]);
      setSearchMessage('');
      return undefined;
    }

    let isEffectActive = true;
    setIsSearching(true);
    const searchTimerId = setTimeout(() => {
      fetchPlaceSuggestions(typedName)
        .then((foundPlaces) => {
          if (!isEffectActive) return;
          setSuggestions(foundPlaces);
          setSearchMessage(foundPlaces.length === 0 ? ADMIN_MESSAGES.noPlacesFound : '');
        })
        .catch((searchError) => {
          if (!isEffectActive) return;
          setSuggestions([]);
          setSearchMessage(searchError.message);
        })
        .finally(() => {
          if (isEffectActive) setIsSearching(false);
        });
    }, PLACE_SEARCH_DEBOUNCE_MS);

    return () => {
      isEffectActive = false;
      clearTimeout(searchTimerId);
    };
  }, [stopName]);

  const choosePlace = (chosenPlace) => {
    chosenNameRef.current = chosenPlace.stopName;
    setSuggestions([]);
    setSearchMessage('');
    onChoosePlace(chosenPlace);
  };

  return (
    <View style={styles.fieldBlock}>
      <AppTextInput
        label="Stop name"
        placeholder="Koswatta"
        value={stopName}
        onChangeText={onChangeName}
        errorText={errorText}
        helperText={ADMIN_MESSAGES.placeSearchHint}
        iconName="search-outline"
        autoCorrect={false}
      />

      {isSearching && (
        <Text style={[typography.caption, styles.mutedText]}>{ADMIN_MESSAGES.placeSearching}</Text>
      )}

      {!isSearching && Boolean(searchMessage) && (
        <Text style={[typography.caption, styles.mutedText]}>{searchMessage}</Text>
      )}

      {suggestions.length > 0 && (
        <View style={styles.suggestionList}>
          {suggestions.map((placeSuggestion) => (
            <Pressable
              key={placeSuggestion.placeId}
              onPress={() => choosePlace(placeSuggestion)}
              accessibilityRole="button"
              accessibilityLabel={`${placeSuggestion.stopName}. ${placeSuggestion.description}`}
              style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}
            >
              <Ionicons
                name="location-outline"
                size={sizes.iconMedium}
                color={colors.primary[600]}
              />
              <View style={styles.suggestionTextBlock}>
                <Text style={typography.bodyMedium}>{placeSuggestion.stopName}</Text>
                <Text style={[typography.caption, styles.mutedText]} numberOfLines={2}>
                  {placeSuggestion.description}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    gap: spacing.xs,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  suggestionList: {
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    padding: spacing.md,
  },
  suggestionPressed: {
    backgroundColor: colors.primary[100],
  },
  suggestionTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
});
