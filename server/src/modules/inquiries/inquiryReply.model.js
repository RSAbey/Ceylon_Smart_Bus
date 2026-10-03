// INQUIRY_REPLY table: an admin's answer to an inquiry (weak entity of INQUIRY).
const { Schema, model } = require('mongoose');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const inquiryReplySchema = new Schema(
  {
    inquiryId: { type: Schema.Types.ObjectId, ref: 'Inquiry', required: true },
    /** adminId: the admin user who wrote the reply. */
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: buildToJsonOptions() }
);

module.exports = model('InquiryReply', inquiryReplySchema);
