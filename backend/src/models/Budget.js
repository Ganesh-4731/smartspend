import mongoose from 'mongoose';
import { EXPENSE_CATEGORIES } from '../utils/constants.js';
import { fromMinor } from '../utils/money.js';

// One budget document per user per calendar month ("YYYY-MM"). A new month simply has no budget until created,
// which "resets" the view without touching historical budgets or transactions.
const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    overallLimitMinor: { type: Number, default: null, min: 1, validate: (v) => v === null || Number.isInteger(v) },
    categoryLimits: {
      type: [
        new mongoose.Schema(
          {
            category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
            limitMinor: { type: Number, required: true, min: 1, validate: Number.isInteger },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        ret.overallLimit = ret.overallLimitMinor == null ? null : fromMinor(ret.overallLimitMinor);
        ret.categoryLimits = (ret.categoryLimits || []).map((c) => ({ category: c.category, limit: fromMinor(c.limitMinor) }));
        delete ret._id;
        delete ret.__v;
        delete ret.user;
        delete ret.overallLimitMinor;
        return ret;
      },
    },
  }
);

budgetSchema.index({ user: 1, month: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);
