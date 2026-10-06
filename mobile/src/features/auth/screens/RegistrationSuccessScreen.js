// Step 4 of registration: confirmation that the account is active (Member 01).
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useAuth } from '../../../context/AuthContext';
import { getNameInitials } from '../../../utils/formatters';
import { ROLE_HOME_ROUTES } from '../../../utils/constants';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { REGISTRATION_STEPS, REGISTRATION_STEP_COUNT } from '../constants';

const SUCCESS_CIRCLE_SIZE = 96;

/** What the passenger can do now that the account is active. */
const UNLOCKED_FEATURES = [
  'Track your bus live and see its arrival time',
  'Buy digital tickets and show them offline',
  'Get alerts when your bus is near or delayed',
];

/**
 * Success screen shown after the code is confirmed. The session already exists, so Get Started goes Home.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function RegistrationSuccessScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <ScreenContainer
      isScrollable
      header={
        <AppHeader
          variant="back"
          title="Verification"
          stepLabel={`${REGISTRATION_STEPS.done} of ${REGISTRATION_STEP_COUNT}`}
        />
      }
    >
      <View style={styles.successBlock}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={sizes.iconHuge} color={colors.success.dark} />
        </View>
        <Text style={[typography.heading1, styles.centeredText]}>Verification Successful</Text>
        <Text style={[typography.bodyLarge, styles.centeredText, styles.mutedText]}>
          Your mobile number has been verified. Your passenger account is now active and ready.
        </Text>
      </View>

      <AppCard>
        <View style={styles.cardHeaderRow}>
          <Text style={[typography.label, styles.mutedText]}>Activated profile</Text>
          <StatusBadge status="active" />
        </View>
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <Text style={[typography.heading3, styles.avatarText]}>{getNameInitials(user?.fullName)}</Text>
          </View>
          <View>
            <Text style={typography.heading3}>{user?.fullName}</Text>
            <Text style={[typography.bodyMedium, styles.mutedText]}>{user?.mobile}</Text>
          </View>
        </View>
      </AppCard>

      <View style={styles.featureList}>
        {UNLOCKED_FEATURES.map((featureText) => (
          <View key={featureText} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={sizes.iconMedium} color={colors.success.dark} />
            <Text style={[typography.bodyMedium, styles.featureText]}>{featureText}</Text>
          </View>
        ))}
      </View>

      <AppButton
        label="Get Started"
        size="large"
        isFullWidth
        onPress={() => router.replace(ROLE_HOME_ROUTES[user?.role] || ROLE_HOME_ROUTES.passenger)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  successBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  successCircle: {
    width: SUCCESS_CIRCLE_SIZE,
    height: SUCCESS_CIRCLE_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.success.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  centeredText: {
    textAlign: 'center',
  },
  mutedText: {
    color: colors.text.secondary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: sizes.borderThin,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
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
  featureList: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureText: {
    flex: 1,
    color: colors.text.primary,
  },
});
