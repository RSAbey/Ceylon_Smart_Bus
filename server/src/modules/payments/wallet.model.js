// WALLET table: a passenger's prepaid mobile-wallet balance, topped up and spent on fares.
// Added beyond the original ERD so a passenger can top up once and pay several fares from it.
const { Schema, model } = require('mongoose');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const walletSchema = new Schema(
  {
    /** userId: one wallet per passenger (1:1 with USER). */
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    /** balance: rupees available to spend. Never negative - the service refuses to overdraw. */
    balance: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: buildToJsonOptions() }
);

module.exports = model('Wallet', walletSchema);
