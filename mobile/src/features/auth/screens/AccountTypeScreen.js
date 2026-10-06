// Step 1 of registration: choose passenger or driver (Member 01).
// Drivers cannot self-register — an admin creates their account — so choosing Driver explains that instead.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppButton from '../../../components/ui/AppButton';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { ACCOUNT_TYPES, REGISTRATION_STEPS, REGISTRATION_STEP_COUNT } from '../constants';

const ACCOUNT_TYPE_OPTIONS = [
  {
    key: ACCOUNT_TYPES.PASSENGER,
    iconName: 'person-outline',
    title: 'Passenger',
    description: 'Track buses live, buy tickets, and travel across Sri Lanka',
  },
  {
    key: ACCOUNT_TYPES.DRIVER,
    iconName: 'bus-outline',
    title: 'Driver / Partner',
    description: 'Run trips, verify passenger tickets, and report delays on your route',
  },
];

/**
 * One selectable account-type card with a radio indicator.
 * @param {object} props - Component props.
 * @param {object} props.accountTypeOption - Entry from ACCOUNT_TYPE_OPTIONS.
 * @param {boolean} props.isSelected - Whether this card is chosen.
 * @param {Function} props.onSelect - Called when the card is tapped.
 * @returns {import('react').JSX.Element} The card.
 */
function AccountTypeCard({ accountTypeOption, isSelected, onSelect }) {
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${accountTypeOption.title}. ${accountTypeOption.description}`}
      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
    >
      <View style={styles.optionIconCircle}>
        <Ionicons name={accountTypeOption.iconName} size={sizes.iconMedium} color={colors.primary[600]} />
      </View>
      <View style={styles.optionTextBlock}>
        <Text style={[typography.heading3, styles.optionTitle]}>{accountTypeOption.title}</Text>
        <Text style={[typography.bodySmall, styles.mutedText]}>{accountTypeOption.description}</Text>
      </View>
      <Ionicons
        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
        size={sizes.iconLarge}
        color={isSelected ? colors.primary[500] : colors.text.disabled}
      />
    </Pressable>
  );
}

/**
 * Account type chooser. Passengers continue to the sign-up form; drivers are told to contact an admin.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function AccountTypeScreen() {
  const router = useRouter();
  const [selectedAccountType, setSelectedAccountType] = useState(ACCOUNT_TYPES.PASSENGER);
  const isDriverSelected = selectedAccountType === ACCOUNT_TYPES.DRIVER;

  return (
    <ScreenContainer
      isScrollable
      header={
        <AppHeader
          variant="back"
          title="Choose Account"
          onBackPress={router.canGoBack() ? router.back : undefined}
          stepLabel={`${REGISTRATION_STEPS.chooseAccount} of ${REGISTRATION_STEP_COUNT}`}
        />
      }
    >
      <View style={styles.introBlock}>
        <Text style={typography.display}>How will you use our platform?</Text>
        <Text style={[typography.bodyLarge, styles.mutedText]}>
          Select your primary account type. You can register separate details later.
        </Text>
      </View>

      <View style={styles.optionList} accessibilityRole="radiogroup">
        {ACCOUNT_TYPE_OPTIONS.map((accountTypeOption) => (
          <AccountTypeCard
            key={accountTypeOption.key}
            accountTypeOption={accountTypeOption}
            isSelected={selectedAccountType === accountTypeOption.key}
            onSelect={() => setSelectedAccountType(accountTypeOption.key)}
          />
        ))}
      </View>

      {isDriverSelected ? (
        <View style={styles.noticeCard} accessibilityLiveRegion="polite">
          <Ionicons name="information-circle" size={sizes.iconLarge} color={colors.information.dark} />
          <View style={styles.optionTextBlock}>
            <Text style={[typography.bodyMedium, styles.noticeText]}>
              Driver accounts are created by Ceylon Smart Bus administrators, who verify your licence and NIC first.
            </Text>
            <AppButton
              label="Already a driver? Sign in"
              variant="text"
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        </View>
      ) : (
        <AppButton
          label="Continue"
          size="large"
          isFullWidth
          onPress={() => router.push('/(auth)/register')}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  introBlock: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  optionList: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionCardSelected: {
    borderColor: colors.primary[500],
    borderWidth: sizes.borderThick,
  },
  optionIconCircle: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.pill,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  optionTitle: {
    color: colors.text.primary,
  },
  noticeCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.information.light,
  },
  noticeText: {
    color: colors.information.dark,
  },
});
