import mongoose from 'mongoose';
import { ALL_CATEGORIES, PAYMENT_METHODS } from '../utils/constants.js';
import { fromMinor } from '../utils/money.js';

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    amountMinor: { type: Number, required: true, min: 1, validate: Number.isInteger }, // always positive; sign comes from `type`
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, enum: ALL_CATEGORIES, required: true },
    date: { type: Date, required: true }, // calendar date stored at UTC midnight
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'Other' },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    tags: { type: [{ type: String, trim: true, maxlength: 30 }], default: [], validate: (v) => v.length <= 10 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        ret.amount = fromMinor(ret.amountMinor);
        delete ret._id;
        delete ret.__v;
        delete ret.amountMinor;
        delete ret.user;
        return ret;
      },
    },
  }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, category: 1, date: -1 });

export default mongoose.model('Transaction', transactionSchema);
