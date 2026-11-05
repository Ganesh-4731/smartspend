import mongoose from 'mongoose';
import { fromMinor, pct } from '../utils/money.js';

// Contributions are embedded (bounded: max 1000 per goal) so a contribution and the goal's saved total can be
// updated atomically in one document write. Contributions are NOT expenses/income transactions: they are earmarked
// portions of the existing balance, so they never change cash-flow totals (no double counting).
const contributionSchema = new mongoose.Schema({
  amountMinor: { type: Number, required: true, min: 1, validate: Number.isInteger },
  date: { type: Date, required: true },
  note: { type: String, trim: true, maxlength: 200, default: '' },
});

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    targetMinor: { type: Number, required: true, min: 1, validate: Number.isInteger },
    savedMinor: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    targetDate: { type: Date, required: true },
    contributions: { type: [contributionSchema], default: [], validate: (v) => v.length <= 1000 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        ret.target = fromMinor(ret.targetMinor);
        ret.saved = fromMinor(ret.savedMinor);
        ret.remaining = fromMinor(Math.max(ret.targetMinor - ret.savedMinor, 0));
        ret.percent = Math.min(pct(ret.savedMinor, ret.targetMinor) ?? 0, 100);
        ret.completed = ret.savedMinor >= ret.targetMinor;
        ret.contributions = (ret.contributions || [])
          .map((c) => ({ id: c._id.toString(), amount: fromMinor(c.amountMinor), date: c.date, note: c.note }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        delete ret._id;
        delete ret.__v;
        delete ret.user;
        delete ret.targetMinor;
        delete ret.savedMinor;
        return ret;
      },
    },
  }
);

goalSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('SavingsGoal', goalSchema);
