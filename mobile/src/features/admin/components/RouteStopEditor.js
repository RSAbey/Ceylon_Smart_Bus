// The stop list on the route form. A route is the stops in the order a bus calls at them, so order
// is the thing being edited: each stop can be moved up or down, and its position is shown as the
// number passengers see. Dragging is deliberately not used — a drag handle beside four text fields
// on a phone is easy to trigger by accident, and two arrows cannot be.
import { StyleSheet, Text, View } from 'react-native';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import AppTextInput from '../../../components/ui/AppTextInput';
import { colors, spacing, typography } from '../../../theme';

const FIRST_STOP_INDEX = 0;
const ONE_PLACE = 1;

/**
 * The editable stop list.
 * @param {object} props - Component props.
 * @param {Array<object>} props.stops - Stops in travel order; each has stopName, latitude,
 *   longitude and fareFromOrigin as strings, because they are typed.
 * @param {Object<string, string>} props.stopErrors - Error text per "index.field" key.
 * @param {Function} props.onChangeStop - Called with (index, fieldName, typedText).
 * @param {Function} props.onMoveStop - Called with (index, places) to move a stop up or down.
 * @param {Function} props.onRemoveStop - Called with the index to remove.
 * @param {Function} props.onAddStop - Called to append an empty stop.
 * @returns {import('react').JSX.Element} The editor.
 */
export default function RouteStopEditor({
  stops,
  stopErrors,
  onChangeStop,
  onMoveStop,
  onRemoveStop,
  onAddStop,
}) {
  const lastStopIndex = stops.length - ONE_PLACE;

  return (
    <View style={styles.editorBlock}>
      <Text style={typography.sectionHeading}>Stops in travel order</Text>
      <Text style={[typography.caption, styles.mutedText]}>
        At least two: where the bus starts and where it ends. The fare is counted from the first stop.
      </Text>

      {stops.map((routeStop, stopIndex) => (
        <AppCard key={`stop-${stopIndex}`}>
          <View style={styles.stopBody}>
            <Text style={typography.label}>{`Stop ${stopIndex + ONE_PLACE}`}</Text>
            <AppTextInput
              label="Stop name"
              placeholder="Koswatta"
              value={routeStop.stopName}
              onChangeText={(typedText) => onChangeStop(stopIndex, 'stopName', typedText)}
              errorText={stopErrors[`${stopIndex}.stopName`]}
            />
            <AppTextInput
              label="Latitude"
              placeholder="6.9065"
              value={routeStop.latitude}
              onChangeText={(typedText) => onChangeStop(stopIndex, 'latitude', typedText)}
              errorText={stopErrors[`${stopIndex}.latitude`]}
              keyboardType="numbers-and-punctuation"
            />
            <AppTextInput
              label="Longitude"
              placeholder="79.9215"
              value={routeStop.longitude}
              onChangeText={(typedText) => onChangeStop(stopIndex, 'longitude', typedText)}
              errorText={stopErrors[`${stopIndex}.longitude`]}
              keyboardType="numbers-and-punctuation"
            />
            <AppTextInput
              label="Fare from the first stop (Rs.)"
              placeholder="40"
              value={routeStop.fareFromOrigin}
              onChangeText={(typedText) => onChangeStop(stopIndex, 'fareFromOrigin', typedText)}
              errorText={stopErrors[`${stopIndex}.fareFromOrigin`]}
              keyboardType="number-pad"
            />
            <View style={styles.stopActions}>
              <AppButton
                label="Move up"
                iconName="arrow-up-outline"
                variant="outline"
                size="small"
                isDisabled={stopIndex === FIRST_STOP_INDEX}
                onPress={() => onMoveStop(stopIndex, -ONE_PLACE)}
              />
              <AppButton
                label="Move down"
                iconName="arrow-down-outline"
                variant="outline"
                size="small"
                isDisabled={stopIndex === lastStopIndex}
                onPress={() => onMoveStop(stopIndex, ONE_PLACE)}
              />
              <AppButton
                label="Remove"
                iconName="close-outline"
                variant="error"
                size="small"
                onPress={() => onRemoveStop(stopIndex)}
              />
            </View>
          </View>
        </AppCard>
      ))}

      <AppButton
        label="Add a stop"
        iconName="add-outline"
        variant="outline"
        isFullWidth
        onPress={onAddStop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  editorBlock: {
    gap: spacing.md,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  stopBody: {
    gap: spacing.md,
  },
  stopActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
