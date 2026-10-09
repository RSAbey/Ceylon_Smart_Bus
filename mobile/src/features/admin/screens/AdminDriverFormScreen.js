// Registering or editing a driver. Registering creates the USER account as well as the
// DRIVER_PROFILE, which is why a password is asked for once and never shown again; editing cannot
// change the password, because that is the driver's own to change from their profile.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppButton from '../../../components/ui/AppButton';
import AppTextInput from '../../../components/ui/AppTextInput';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useToast } from '../../../components/ui/ToastMessage';
import { measurePassword } from '../../../utils/passwordRules';
import PasswordStrengthMeter from '../../../components/ui/PasswordStrengthMeter';
import { colors, typography } from '../../../theme';
import AdminPickerField from '../components/AdminPickerField';
import {
  DRIVER_DUTY_STATUSES,
  DUTY_STATUS_LABELS,
  LICENSE_CLASS_LABELS,
} from '../constants';
import {
  assignBusToDriver,
  createDriver,
  fetchAssignableBuses,
  fetchDrivers,
  updateDriver,
} from '../services/adminTransportApi';

/** Sri Lankan NIC: nine digits plus V or X, or the newer twelve-digit form. */
const NIC_PATTERN = /^(?:\d{9}[VXvx]|\d{12})$/;
const SRI_LANKA_MOBILE_PATTERN = /^0\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** The picker key that means "no bus". */
const NO_BUS = 'none';

/**
 * Admin driver form.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function AdminDriverFormScreen() {
  const router = useRouter();
  const { driverId } = useLocalSearchParams();
  const { showSuccessToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [nic, setNic] = useState('');
  const [licenseClass, setLicenseClass] = useState('heavy_vehicle');
  const [dutyStatus, setDutyStatus] = useState(DRIVER_DUTY_STATUSES.ACTIVE);
  const [busKey, setBusKey] = useState(NO_BUS);
  const [originalBusKey, setOriginalBusKey] = useState(NO_BUS);
  const [busOptions, setBusOptions] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(driverId);

  useEffect(() => {
    let isEffectActive = true;

    /**
     * Loads the bus picker and, when editing, the driver being changed.
     * @returns {Promise<void>} Resolves once the form is ready.
     */
    async function loadFormContents() {
      try {
        const assignableBuses = await fetchAssignableBuses();
        if (!isEffectActive) return;
        setBusOptions(assignableBuses);

        if (!isEditing) return;
        const roster = await fetchDrivers();
        if (!isEffectActive) return;
        const matchingRow = roster.drivers.find((driverRow) => driverRow.driver.id === driverId);
        if (!matchingRow) {
          setLoadErrorMessage('That driver no longer exists.');
          return;
        }
        const { driver } = matchingRow;
        setFullName(driver.userId?.fullName || '');
        setEmail(driver.userId?.email || '');
        setMobile(driver.userId?.mobile || '');
        setLicenseNumber(driver.licenseNumber);
        setNic(driver.nic);
        setLicenseClass(driver.licenseClass);
        setDutyStatus(driver.dutyStatus);
        setBusKey(matchingRow.bus?.id || NO_BUS);
        setOriginalBusKey(matchingRow.bus?.id || NO_BUS);
      } catch (loadError) {
        if (isEffectActive) setLoadErrorMessage(loadError.message);
      } finally {
        if (isEffectActive) setIsLoading(false);
      }
    }

    loadFormContents();
    return () => {
      isEffectActive = false;
    };
  }, [driverId, isEditing]);

  const busPickerOptions = useMemo(
    () => [
      { key: NO_BUS, label: 'No bus' },
      ...busOptions.map((assignableBus) => ({
        key: assignableBus.id,
        label: assignableBus.currentDriverName
          ? `${assignableBus.busCode} (with ${assignableBus.currentDriverName})`
          : assignableBus.busCode,
      })),
    ],
    [busOptions]
  );

  const saveDriver = useCallback(async () => {
    const formErrors = {};
    if (!fullName.trim()) formErrors.fullName = "Enter the driver's full name.";
    if (!EMAIL_PATTERN.test(email.trim())) formErrors.email = 'Enter a valid email address.';
    if (!SRI_LANKA_MOBILE_PATTERN.test(mobile.trim())) {
      formErrors.mobile = 'Enter a Sri Lankan mobile number, for example 0771234567.';
    }
    if (!licenseNumber.trim()) formErrors.licenseNumber = 'Enter the driving licence number.';
    if (!NIC_PATTERN.test(nic.trim())) {
      formErrors.nic = 'Enter a valid NIC, for example 199007158812.';
    }
    if (!isEditing && !measurePassword(password).isStrongEnough) {
      formErrors.password = 'Finish the three rules under the password box.';
    }
    setFieldErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setIsSaving(true);
    try {
      if (isEditing) {
        await updateDriver(driverId, {
          fullName: fullName.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          licenseNumber: licenseNumber.trim(),
          nic: nic.trim(),
          licenseClass,
          dutyStatus,
        });
        // The bus lives on BUS.driverId, so it is a separate call and only worth making on a change.
        if (busKey !== originalBusKey) {
          await assignBusToDriver(driverId, busKey === NO_BUS ? null : busKey);
        }
        showSuccessToast('Driver updated.');
      } else {
        const createdDriver = await createDriver({
          fullName: fullName.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          password,
          licenseNumber: licenseNumber.trim(),
          nic: nic.trim(),
          licenseClass,
        });
        if (busKey !== NO_BUS) {
          await assignBusToDriver(createdDriver.driver?.id || createdDriver.id, busKey);
        }
        showSuccessToast('Driver registered. They can sign in with the password you set.');
      }
      router.back();
    } catch (saveError) {
      setFieldErrors(saveError.fieldErrors || {});
      if (Object.keys(saveError.fieldErrors || {}).length === 0) {
        setLoadErrorMessage(saveError.message);
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    fullName,
    email,
    mobile,
    password,
    licenseNumber,
    nic,
    licenseClass,
    dutyStatus,
    busKey,
    originalBusKey,
    isEditing,
    driverId,
    router,
    showSuccessToast,
  ]);

  const screenHeader = (
    <AppHeader
      variant="back"
      title={isEditing ? 'Edit driver' : 'Register a driver'}
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading the form..." />
      </ScreenContainer>
    );
  }

  if (loadErrorMessage && !isSaving) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={router.back} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer header={screenHeader} isScrollable>
      <AppTextInput
        label="Full name"
        placeholder="Sunil Perera"
        value={fullName}
        onChangeText={setFullName}
        errorText={fieldErrors.fullName}
      />
      <AppTextInput
        label="Email"
        placeholder="sunil.driver@ceylonsmartbus.lk"
        value={email}
        onChangeText={setEmail}
        errorText={fieldErrors.email}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <AppTextInput
        label="Mobile number"
        placeholder="0771234567"
        value={mobile}
        onChangeText={setMobile}
        errorText={fieldErrors.mobile}
        keyboardType="phone-pad"
      />
      {!isEditing && (
        <AppTextInput
          label="First password"
          placeholder="The password they will sign in with"
          value={password}
          onChangeText={setPassword}
          errorText={fieldErrors.password}
          isPasswordField
          autoComplete="new-password"
        />
      )}
      {!isEditing && <PasswordStrengthMeter password={password} />}
      <AppTextInput
        label="Licence number"
        placeholder="B4521873"
        value={licenseNumber}
        onChangeText={setLicenseNumber}
        errorText={fieldErrors.licenseNumber}
        autoCapitalize="characters"
      />
      <AppTextInput
        label="NIC"
        placeholder="199007158812"
        value={nic}
        onChangeText={setNic}
        errorText={fieldErrors.nic}
        autoCapitalize="characters"
      />
      <AdminPickerField
        label="Licence class"
        options={Object.entries(LICENSE_CLASS_LABELS).map(([classValue, classLabel]) => ({
          key: classValue,
          label: classLabel,
        }))}
        selectedKey={licenseClass}
        onSelect={setLicenseClass}
        errorText={fieldErrors.licenseClass}
      />
      {isEditing && (
        <AdminPickerField
          label="Duty status"
          options={Object.values(DRIVER_DUTY_STATUSES).map((statusValue) => ({
            key: statusValue,
            label: DUTY_STATUS_LABELS[statusValue],
          }))}
          selectedKey={dutyStatus}
          onSelect={setDutyStatus}
          helperText="A suspended driver cannot sign in at all; one on leave still can."
          errorText={fieldErrors.dutyStatus}
        />
      )}
      <AdminPickerField
        label="Bus"
        options={busPickerOptions}
        selectedKey={busKey}
        onSelect={setBusKey}
        helperText="A bus already with another driver will be moved to this one."
      />

      <AppButton
        label={isEditing ? 'Save changes' : 'Register the driver'}
        size="large"
        isFullWidth
        isLoading={isSaving}
        onPress={saveDriver}
      />
      {isEditing && (
        <Text style={[typography.caption, styles.mutedText]}>
          A driver changes their own password from their profile, so it cannot be changed here.
        </Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
});
