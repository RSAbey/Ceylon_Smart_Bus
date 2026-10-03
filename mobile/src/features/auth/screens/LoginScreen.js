// Login screen (Member 01): email or mobile + password for passengers and drivers. Built in the foundation as the first real screen.
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppTextInput from '../../../components/ui/AppTextInput';
import AppButton from '../../../components/ui/AppButton';
import { useAuth } from '../../../context/AuthContext';
import { ROLE_HOME_ROUTES } from '../../../utils/constants';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { LOGIN_MESSAGES } from '../constants';

const brandLogo = require('../../../../assets/images/logo.png');

const LOGO_SIZE = 160;

/**
 * Client-side check so the user gets instant feedback; the server validates again.
 * @param {string} identifier - Email or mobile number.
 * @param {string} password - Password.
 * @returns {Object<string, string>} Field name -> error text (empty when valid).
 */
function validateLoginForm(identifier, password) {
  const formErrors = {};
  if (!identifier.trim()) formErrors.identifier = LOGIN_MESSAGES.identifierRequired;
  if (!password) formErrors.password = LOGIN_MESSAGES.passwordRequired;
  return formErrors;
}

/**
 * Sign-in form. On success the user is sent to the home screen of their role.
 * @returns {import('react').JSX.Element} Login screen.
 */
export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  const submitLogin = async () => {
    const formErrors = validateLoginForm(identifier, password);
    setFieldErrors(formErrors);
    setLoginErrorMessage('');
    if (Object.keys(formErrors).length > 0) return;

    setIsSigningIn(true);
    try {
      const signedInUser = await signIn(identifier.trim(), password);
      router.replace(ROLE_HOME_ROUTES[signedInUser.role]);
    } catch (loginError) {
      setFieldErrors(loginError.fieldErrors || {});
      setLoginErrorMessage(loginError.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <ScreenContainer isScrollable safeEdges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.brandArea}>
        <Image source={brandLogo} style={styles.logoImage} accessibilityLabel="Ceylon Smart Bus logo" />
        <Text style={[typography.display, styles.titleText]}>Welcome back</Text>
        <Text style={[typography.bodyLarge, styles.subtitleText]}>Sign in to track buses and manage your tickets.</Text>
      </View>

      <View style={styles.formArea}>
        <AppTextInput
          label="Email or mobile number"
          iconName="person-outline"
          placeholder="you@example.com or 07XXXXXXXX"
          value={identifier}
          onChangeText={setIdentifier}
          errorText={fieldErrors.identifier}
          autoCapitalize="none"
          autoComplete="username"
          keyboardType="email-address"
        />
        <AppTextInput
          label="Password"
          iconName="lock-closed-outline"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          errorText={fieldErrors.password}
          isPasswordField
          autoComplete="password"
        />

        {Boolean(loginErrorMessage) && (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={sizes.iconMedium} color={colors.error.dark} />
            <Text style={[typography.bodyMedium, styles.errorBannerText]}>{loginErrorMessage}</Text>
          </View>
        )}

        <AppButton label="Sign in" size="large" isFullWidth isLoading={isSigningIn} onPress={submitLogin} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brandArea: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  logoImage: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    resizeMode: 'contain',
  },
  titleText: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitleText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  formArea: {
    gap: spacing.lg,
    marginTop: spacing.xxl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.error.light,
  },
  errorBannerText: {
    flex: 1,
    color: colors.error.dark,
  },
});
