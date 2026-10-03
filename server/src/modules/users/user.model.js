// USER table: every account (passenger, driver or admin) — ERD supertype with a disjoint, total role specialisation.
const { Schema, model } = require('mongoose');
const { USER_ROLES, USER_STATUSES } = require('./user.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

/**
 * FR-01 lets a user register with an email OR a mobile number, so email is required only when mobile is absent.
 * @this {object} The user document being validated.
 * @returns {boolean} True when email must be supplied.
 */
function isEmailRequired() {
  return !this.mobile;
}

/**
 * Mobile is required only when email is absent (see isEmailRequired).
 * @this {object} The user document being validated.
 * @returns {boolean} True when mobile must be supplied.
 */
function isMobileRequired() {
  return !this.email;
}

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    /** email / mobile: unique + sparse so either one may be missing; at least one is required. */
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      required: [isEmailRequired, 'Email or mobile number is required.'],
    },
    mobile: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      required: [isMobileRequired, 'Email or mobile number is required.'],
    },
    /** passwordHash: bcrypt hash only (NFR-07); excluded from queries by default and from every API response. */
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(USER_ROLES), default: USER_ROLES.PASSENGER },
    /** status: a blocked user is rejected by authenticateToken even with a valid token. */
    status: { type: String, enum: Object.values(USER_STATUSES), default: USER_STATUSES.ACTIVE },
    avatarUrl: { type: String, trim: true },
  },
  { timestamps: true, toJSON: buildToJsonOptions(['passwordHash']) }
);

module.exports = model('User', userSchema);
