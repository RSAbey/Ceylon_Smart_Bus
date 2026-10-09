// Password strength meter (Member 01): three segments, one per rule, that turn green as each rule is
// met. The rules are also listed in words with a tick or a cross, so the meter never relies on
// colour alone to say what is wrong (NFR-09).
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, sizes, spacing, typography } from '../../theme';
import { describeMissingRules, measurePassword } from '../../utils/passwordRules';

/**
 * The meter and its instructions.
 * @param {object} props - Component props.
 * @param {string} props.password - What has been typed so far.
 * @returns {import('react').JSX.Element | null} The meter, or nothing before typing starts.
 */
export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;

  const { results, metCount, isStrongEnough, missingLabels } = measurePassword(password);

  return (
    <View
      style={styles.meterBlock}
      accessibilityLabel={
        isStrongEnough
          ? 'Password meets all three rules.'
          : `Password meets ${metCount} of 3 rules. ${describeMissingRules(missingLabels)}`
      }
    >
      <View style={styles.segmentRow}>
        {results.map((ruleResult) => (
          <View
            key={ruleResult.key}
            style={[styles.segment, ruleResult.isMet ? styles.segmentMet : styles.segmentUnmet]}
          />
        ))}
      </View>

      <Text style={[typography.caption, isStrongEnough ? styles.strongText : styles.weakText]}>
        {isStrongEnough ? 'Strong password' : describeMissingRules(missingLabels)}
      </Text>

      {!isStrongEnough && (
        <View style={styles.ruleList}>
          {results.map((ruleResult) => (
            <View key={ruleResult.key} style={styles.ruleRow}>
              <Ionicons
                name={ruleResult.isMet ? 'checkmark-circle' : 'ellipse-outline'}
                size={sizes.iconSmall}
                color={ruleResult.isMet ? colors.success.main : colors.text.disabled}
              />
              <Text style={[typography.caption, styles.ruleText]}>{ruleResult.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  meterBlock: {
    gap: spacing.xs,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: sizes.borderThick * 2,
    borderRadius: radii.pill,
  },
  segmentMet: {
    backgroundColor: colors.success.main,
  },
  segmentUnmet: {
    backgroundColor: colors.error.main,
  },
  strongText: {
    color: colors.success.dark,
  },
  weakText: {
    color: colors.error.dark,
  },
  ruleList: {
    gap: spacing.xxs,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ruleText: {
    color: colors.text.secondary,
  },
});
