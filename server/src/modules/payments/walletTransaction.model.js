// WALLET_TRANSACTION table: one line of a wallet's history (weak entity of WALLET).
// Added beyond the original ERD so the balance can always be explained line by line.
const { Schema, model } = require('mongoose');
const { WALLET_TRANSACTION_TYPES } = require('./payment.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const walletTransactionSchema = new Schema(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    type: { type: String, enum: Object.values(WALLET_TRANSACTION_TYPES), required: true },
    /** amount: always positive; `type` says whether it was added or taken away. */
    amount: { type: Number, required: true, min: 0 },
    /** balanceAfter: the running balance, so a statement never has to be recomputed to be read. */
    balanceAfter: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    /** ticketId: set when the line paid for or refunded a fare. */
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket' },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: buildToJsonOptions() }
);

walletTransactionSchema.index({ walletId: 1, createdAt: -1 });

module.exports = model('WalletTransaction', walletTransactionSchema);
