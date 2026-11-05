import mongoose from 'mongoose';
import { CURRENCIES, THEMES, DATE_FORMATS } from '../utils/constants.js';
import { fromMinor } from '../utils/money.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    tokenVersion: { type: Number, default: 0, select: false },
    openingBalanceMinor: { type: Number, default: 0, validate: Number.isInteger },
    preferences: {
      currency: { type: String, enum: CURRENCIES, default: 'INR' },
      theme: { type: String, enum: THEMES, default: 'light' },
      dateFormat: { type: String, enum: DATE_FORMATS, default: 'DD/MM/YYYY' },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        ret.openingBalance = fromMinor(ret.openingBalanceMinor);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.tokenVersion;
        delete ret.openingBalanceMinor;
        return ret;
      },
    },
  }
);

export default mongoose.model('User', userSchema);
