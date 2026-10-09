// The answer a driver sees after checking a ticket (Member 03): a full-width banner they can read
// at arm's length in a crowded bus, then the journey details underneath.
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from '../../../components/ui/AppCard';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { formatFare } from '../../tickets/formatters';
import { VERIFICATION_BANNERS } from '../constants';

/**
 * One label-and-value line in the ticket details block.
 * @param {object} props - Component props.
 * @param {string} props.label - What the value means.
 * @param {string} props.detail - The value itself.
 * @param {boolean} [props.isWarning] - Draw the value in the error colour (used for an expiry).
 * @returns {import('react').JSX.Element} The row.
 */
function DetailRow({ label, detail, isWarning = false }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[typography.bodyMedium, styles.detailLabel]}>{label}</Text>
      <Text style={[typography.bodyMedium, isWarning && styles.warningValue]}>{detail}</Text>
    </View>
  );
}

/**
 * Valid / invalid banner plus the ticket it refers to.
 * @param {object} props - Component props.
 * @param {object} props.verification - What the server replied.
 * @param {string} props.validUntilText - Pre-formatted expiry, or an empty string when unknown.
 * @returns {import('react').JSX.Element} The result block.
 */
export default function VerificationResult({ verification, validUntilText }) {
  const banner = verification.isValid
    ? VERIFICATION_BANNERS.valid
    : VERIFICATION_BANNERS.invalid;
  const checkedTicket = verification.ticket;
  const seatNumbers = checkedTicket?.seatNumbers || [];

  return (
    <View>
      <View
        style={[styles.banner, verification.isValid ? styles.bannerValid : styles.bannerInvalid]}
        accessibilityRole="alert"
        accessibilityLabel={`${banner.headline}. ${verification.reason}`}
      >
        <View style={styles.bannerIconCircle}>
          <Ionicons
            name={banner.iconName}
            size={sizes.iconXLarge}
            color={verification.isValid ? colors.success.dark : colors.error.dark}
          />
        </View>
        <Text style={[typography.display, styles.bannerHeadline]}>{banner.headline}</Text>
        <Text style={[typography.bodyMedium, styles.bannerReason]}>
          {verification.isValid && seatNumbers.length > 0
            ? `${seatNumbers.length === 1 ? 'Seat' : 'Seats'} ${seatNumbers.join(', ')} confirmed`
            : verification.reason}
        </Text>
      </View>

      {checkedTicket && (
        <AppCard>
          <Text style={typography.heading2}>Bus {checkedTicket.routeNumber || ''}</Text>
          <Text style={[typography.bodyMedium, styles.mutedText]}>
            {checkedTicket.boardingStopName} &#8594; {checkedTicket.alightingStopName}
          </Text>

          <View style={styles.detailDivider} />

          <DetailRow label="Passenger" detail={checkedTicket.passengerName || 'Unknown'} />
          <DetailRow
            label={seatNumbers.length === 1 ? 'Seat' : 'Seats'}
            detail={seatNumbers.join(', ') || 'Released'}
          />
          <DetailRow label="Fare" detail={formatFare(checkedTicket.fareAmount)} />
          <DetailRow label="Ticket ID" detail={checkedTicket.ticketKey} />
          {validUntilText.length > 0 && (
            <DetailRow
              label="Valid until"
              detail={validUntilText}
              isWarning={!verification.isValid}
            />
          )}
        </AppCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
  },
  bannerValid: {
    backgroundColor: colors.success.dark,
  },
  bannerInvalid: {
    backgroundColor: colors.error.dark,
  },
  bannerIconCircle: {
    width: sizes.iconHuge,
    height: sizes.iconHuge,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  bannerHeadline: {
    color: colors.text.onColor,
    textAlign: 'center',
  },
  bannerReason: {
    color: colors.text.onColor,
    textAlign: 'center',
  },
  mutedText: {
    color: colors.text.secondary,
  },
  detailDivider: {
    height: sizes.borderThin,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailLabel: {
    color: colors.text.secondary,
  },
  warningValue: {
    color: colors.error.dark,
  },
});
