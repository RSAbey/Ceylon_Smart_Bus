// Client-side rules for the driver form. The server repeats every one of these checks.

export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SRI_LANKA_MOBILE_PATTERN = /^(?:0\d{9}|\+94\d{9})$/;
const NIC_PATTERN = /^(?:\d{9}[VXvx]|\d{12})$/;

/**
 * Validates the register/edit driver form.
 * @param {object} driverForm - Current field values.
 * @param {boolean} isEditing - True when editing, so the password and contact fields are skipped.
 * @returns {Object<string, string>} Field name -> error message.
 */
export function validateDriverForm(driverForm, isEditing) {
  const formErrors = {};
  if (!driverForm.fullName.trim()) formErrors.fullName = "Enter the driver's full name.";
  if (!driverForm.licenseNumber.trim()) formErrors.licenseNumber = 'Enter the driving licence number.';
  if (!NIC_PATTERN.test(driverForm.nic.trim())) {
    formErrors.nic = 'Enter a valid NIC, for example 199007158812.';
  }

  if (!isEditing) {
    if (!EMAIL_PATTERN.test(driverForm.email.trim())) {
      formErrors.email = 'Please enter a valid email address (e.g. name@domain.com)';
    }
    if (!SRI_LANKA_MOBILE_PATTERN.test(driverForm.mobile.trim())) {
      formErrors.mobile = 'Enter a Sri Lankan mobile number, for example 0771234567.';
    }
    if (driverForm.password.length < MIN_PASSWORD_LENGTH) {
      formErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
  }
  return formErrors;
}
