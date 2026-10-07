// Demo card form (Member 03). The details are sent once to prove the checkout flow works and are
// never stored by the server, so nothing here is a real card record (NFR-07).
import { StyleSheet, View } from 'react-native';
import AppTextInput from '../../../components/ui/AppTextInput';
import { spacing } from '../../../theme';
import { CARD_NUMBER_GROUP_SIZE, CARD_NUMBER_DIGITS, CARD_CVV_DIGITS } from '../constants';

/**
 * Spaces a card number into groups of four as it is typed.
 * @param {string} typedNumber - Raw text from the field.
 * @returns {string} Digits grouped for reading, for example "4242 4242 4242 4242".
 */
export function formatCardNumber(typedNumber) {
  const digitsOnly = typedNumber.replace(/\D/g, '').slice(0, CARD_NUMBER_DIGITS);
  return digitsOnly.replace(new RegExp(`(\\d{${CARD_NUMBER_GROUP_SIZE}})(?=\\d)`, 'g'), '$1 ');
}

/**
 * Inserts the slash in an expiry date as it is typed.
 * @param {string} typedExpiry - Raw text from the field.
 * @returns {string} Expiry as MM/YY.
 */
export function formatCardExpiry(typedExpiry) {
  const digitsOnly = typedExpiry.replace(/\D/g, '').slice(0, 4);
  if (digitsOnly.length < 3) return digitsOnly;
  return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
}

/**
 * The four card fields, used by both the Payment screen and the wallet top-up screen.
 * @param {object} props - Component props.
 * @param {object} props.cardDetails - Current values: cardNumber, cardHolderName, cardExpiry, cardCvv.
 * @param {Function} props.onChangeCardDetails - Called with the whole updated card details object.
 * @param {object} props.fieldErrors - Server or local errors keyed by field name.
 * @returns {import('react').JSX.Element} The form.
 */
export default function CardDetailsForm({ cardDetails, onChangeCardDetails, fieldErrors }) {
  /**
   * Updates one field without disturbing the others.
   * @param {string} fieldName - Which card field changed.
   * @param {string} fieldText - Its new text.
   * @returns {void}
   */
  function changeField(fieldName, fieldText) {
    onChangeCardDetails({ ...cardDetails, [fieldName]: fieldText });
  }

  return (
    <View style={styles.formBlock}>
      <AppTextInput
        label="Card number"
        value={cardDetails.cardNumber}
        onChangeText={(typedNumber) => changeField('cardNumber', formatCardNumber(typedNumber))}
        errorText={fieldErrors.cardNumber}
        helperText="Demo only. Try 4242 4242 4242 4242."
        iconName="card-outline"
        keyboardType="number-pad"
      />
      <AppTextInput
        label="Name on card"
        value={cardDetails.cardHolderName}
        onChangeText={(typedName) => changeField('cardHolderName', typedName)}
        errorText={fieldErrors.cardHolderName}
        iconName="person-outline"
        autoCapitalize="words"
      />
      <View style={styles.sideBySideRow}>
        <View style={styles.sideBySideField}>
          <AppTextInput
            label="Expiry"
            value={cardDetails.cardExpiry}
            onChangeText={(typedExpiry) => changeField('cardExpiry', formatCardExpiry(typedExpiry))}
            errorText={fieldErrors.cardExpiry}
            helperText="MM/YY"
            iconName="calendar-outline"
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.sideBySideField}>
          <AppTextInput
            label="CVV"
            value={cardDetails.cardCvv}
            onChangeText={(typedCvv) =>
              changeField('cardCvv', typedCvv.replace(/\D/g, '').slice(0, CARD_CVV_DIGITS))
            }
            errorText={fieldErrors.cardCvv}
            helperText={`${CARD_CVV_DIGITS} digits`}
            iconName="lock-closed-outline"
            keyboardType="number-pad"
            isPasswordField
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formBlock: {
    gap: spacing.lg,
  },
  sideBySideRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sideBySideField: {
    flex: 1,
  },
});
