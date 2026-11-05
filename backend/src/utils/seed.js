// DEVELOPMENT-ONLY demo data seeder.  Usage: npm run seed
// Creates/refreshes the demo user (demo@smartspend.local) with ~6 months of realistic data.
// Refuses to run when NODE_ENV=production. Never runs automatically.
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env, assertEnv } from '../config/env.js';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import { addMonths, monthKey, monthRange, todayUTC, addDays } from './dates.js';

export const DEMO_EMAIL = 'demo@smartspend.local';
export const DEMO_PASSWORD = 'Demo@12345';

function rng(seed) { // deterministic PRNG so every seed run is identical
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

async function main() {
  if (env.isProd) { console.error('Refusing to seed demo data when NODE_ENV=production.'); process.exit(1); }
  assertEnv();
  await connectDB(env.MONGODB_URI);
  const rand = rng(42);
  const between = (a, b) => Math.round(a + rand() * (b - a));
  const today = todayUTC();
  const thisMonth = monthKey(today);

  await User.findOneAndDelete({ email: DEMO_EMAIL }).then(async (old) => {
    if (old) await Promise.all([Transaction.deleteMany({ user: old._id }), Budget.deleteMany({ user: old._id }), SavingsGoal.deleteMany({ user: old._id })]);
  });
  const user = await User.create({ name: 'Demo User', email: DEMO_EMAIL, passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10), openingBalanceMinor: 2500000 });

  const docs = [];
  const add = (key, day, title, amount, type, category, paymentMethod = 'UPI', tags = []) => {
    const { to } = monthRange(key);
    const d = new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5)) - 1, Math.min(day, to.getUTCDate())));
    if (d > today) return; // no future-dated demo data
    docs.push({ user: user._id, title, amountMinor: Math.round(amount * 100), type, category, date: d, paymentMethod, notes: '', tags });
  };

  for (let off = -5; off <= 0; off++) {
    const k = addMonths(thisMonth, off);
    add(k, 1, 'Monthly salary', 85000, 'income', 'Salary', 'Bank Transfer');
    if (off % 2 === 0) add(k, 15, 'Freelance project', between(12000, 25000), 'income', 'Freelance', 'Bank Transfer');
    if (off === -2) add(k, 20, 'Dividend payout', 3200, 'income', 'Investment Returns', 'Bank Transfer');
    add(k, 3, 'House rent', 22000, 'expense', 'Housing', 'Bank Transfer');
    add(k, 5, 'Netflix', 649, 'expense', 'Subscriptions', 'Credit Card', ['recurring']);
    add(k, 6, 'Spotify', 119, 'expense', 'Subscriptions', 'UPI', ['recurring']);
    add(k, 8, 'Electricity bill', between(1400, 2600), 'expense', 'Utilities', 'UPI');
    add(k, 10, 'Broadband', 799, 'expense', 'Utilities', 'UPI', ['recurring']);
    for (let i = 0; i < between(4, 6); i++) add(k, between(2, 28), ['Big Basket order', 'Local market', 'Supermart'][i % 3], between(800, 3200), 'expense', 'Groceries', 'UPI');
    for (let i = 0; i < between(6, 10); i++) add(k, between(1, 28), ['Lunch', 'Coffee', 'Dinner out', 'Swiggy order'][i % 4], between(150, 900), 'expense', 'Food', i % 2 ? 'UPI' : 'Cash');
    for (let i = 0; i < between(5, 8); i++) add(k, between(1, 28), ['Auto ride', 'Metro recharge', 'Fuel', 'Cab'][i % 4], between(120, 650), 'expense', 'Transport', 'UPI');
    for (let i = 0; i < between(1, 3); i++) add(k, between(3, 27), ['Clothes', 'Amazon order', 'Shoes'][i % 3], between(1000, 5500), 'expense', 'Shopping', 'Credit Card');
    for (let i = 0; i < between(1, 2); i++) add(k, between(3, 27), ['Movie night', 'Concert tickets'][i % 2], between(400, 1800), 'expense', 'Entertainment', 'Debit Card');
    if (off === -3) add(k, 18, 'Weekend trip', 18000, 'expense', 'Travel', 'Credit Card', ['trip']);
    if (off === -1) add(k, 12, 'Online course', 4999, 'expense', 'Education', 'Debit Card');
    if (off % 3 === 0) add(k, 22, 'Pharmacy', between(300, 1500), 'expense', 'Healthcare', 'Cash');
  }
  await Transaction.insertMany(docs);

  await Budget.create([
    { user: user._id, month: thisMonth, overallLimitMinor: 6500000, categoryLimits: [
      { category: 'Food', limitMinor: 500000 }, { category: 'Groceries', limitMinor: 1200000 },
      { category: 'Shopping', limitMinor: 600000 }, { category: 'Entertainment', limitMinor: 250000 } ] },
    { user: user._id, month: addMonths(thisMonth, -1), overallLimitMinor: 6500000, categoryLimits: [{ category: 'Food', limitMinor: 500000 }] },
  ]);

  const c = (amount, daysAgo, note = '') => ({ amountMinor: amount * 100, date: addDays(today, -daysAgo), note });
  await SavingsGoal.create([
    { user: user._id, title: 'Emergency fund', description: '6 months of expenses', targetMinor: 15000000, targetDate: addDays(today, 300),
      savedMinor: 5500000, contributions: [c(20000, 90), c(20000, 60), c(15000, 20, 'Bonus')] },
    { user: user._id, title: 'Goa trip', targetMinor: 4000000, targetDate: addDays(today, 120), savedMinor: 1200000, contributions: [c(7000, 40), c(5000, 10)] },
    { user: user._id, title: 'New headphones', targetMinor: 800000, targetDate: addDays(today, -10), savedMinor: 800000, contributions: [c(5000, 70), c(3000, 45)] },
  ]);

  console.log(`Seeded ${docs.length} transactions, 2 budgets and 3 goals.`);
  console.log(`Demo login -> ${DEMO_EMAIL} / ${DEMO_PASSWORD}  (development only)`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
