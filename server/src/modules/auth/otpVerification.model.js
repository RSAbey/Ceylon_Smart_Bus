// OTP_VERIFICATION table: one-time codes for registration and password reset (weak entity of USER).
const { Schema, model } = require('mongoose');
const { OTP_PURPOSES } = require('../users/user.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const OTP_TTL_EXPIRE_AFTER_SECONDS = 0;

const otpVerificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** codeHash: the OTP is stored hashed, never in plain text. */
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: Object.values(OTP_PURPOSES), required: true },
    /** expiresAt: MongoDB deletes the row automatically at this time (TTL index below). */
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
  },
  { toJSON: buildToJsonOptions(['codeHash']) }
);

otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: OTP_TTL_EXPIRE_AFTER_SECONDS });

module.exports = model('OtpVerification', otpVerificationSchema);
