import { z } from 'zod';
import { parseDay, isMonthKey } from '../utils/dates.js';
import {
  INCOME_CATEGORIES, EXPENSE_CATEGORIES, EXPENSE_CATEGORIES as EXP, PAYMENT_METHODS, CURRENCIES, THEMES, DATE_FORMATS,
} from '../utils/constants.js';

export const dayStr = z
  .string({ required_error: 'Date is required', invalid_type_error: 'Date must be a string' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine((s) => parseDay(s) !== null, 'Invalid calendar date');

export const money = z
  .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
  .finite('Amount must be a finite number')
  .positive('Amount must be greater than 0')
  .max(1e9, 'Amount is too large')
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'Amount can have at most 2 decimal places');

const strictObj = (shape) => z.object(shape).strict();

// ---- auth / users ----
const password = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

export const registerSchema = strictObj({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(254),
  password,
});
export const loginSchema = strictObj({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').max(72),
});
export const updateProfileSchema = strictObj({
  name: z.string().trim().min(2).max(60).optional(),
  openingBalance: z.number().finite().min(-1e12).max(1e12)
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'At most 2 decimal places').optional(),
  preferences: strictObj({
    currency: z.enum(CURRENCIES).optional(),
    theme: z.enum(THEMES).optional(),
    dateFormat: z.enum(DATE_FORMATS).optional(),
  }).optional(),
});
export const changePasswordSchema = strictObj({
  currentPassword: z.string().min(1, 'Current password is required').max(72),
  newPassword: password,
});
export const deleteAccountSchema = strictObj({ password: z.string().min(1, 'Password is required').max(72) });

// ---- transactions ----
export const transactionSchema = strictObj({
  title: z.string().trim().min(1, 'Title is required').max(120),
  amount: money,
  type: z.enum(['income', 'expense']),
  category: z.string(),
  date: dayStr,
  paymentMethod: z.enum(PAYMENT_METHODS).optional().default('Other'),
  notes: z.string().trim().max(500).optional().default(''),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional().default([]),
}).superRefine((v, ctx) => {
  const list = v.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!list.includes(v.category)) {
    ctx.addIssue({ code: 'custom', path: ['category'], message: `Category must be one of: ${list.join(', ')}` });
  }
});

const optNum = z.coerce.number().finite().nonnegative().optional();
export const rangeQuery = z.object({ from: dayStr.optional(), to: dayStr.optional() }).superRefine((v, ctx) => {
  if (v.from && v.to) {
    const a = parseDay(v.from), b = parseDay(v.to);
    if (a > b) ctx.addIssue({ code: 'custom', path: ['to'], message: '"to" must not be before "from"' });
    if ((b - a) / 86400000 > 366 * 5) ctx.addIssue({ code: 'custom', path: ['to'], message: 'Range cannot exceed 5 years' });
  }
});
export const transactionListQuery = z.object({
  page: z.coerce.number().int().min(1).max(100000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().trim().max(100).optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().max(40).optional(),
  from: dayStr.optional(),
  to: dayStr.optional(),
  minAmount: optNum,
  maxAmount: optNum,
  sort: z.enum(['date', 'amount']).optional().default('date'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
}).strict();

// ---- budgets ----
export const monthStr = z.string().refine(isMonthKey, 'Month must be YYYY-MM');
export const budgetSchema = strictObj({
  month: monthStr,
  overallLimit: money.nullable().optional(),
  categoryLimits: z.array(strictObj({ category: z.enum(EXP), limit: money })).max(EXP.length).optional().default([]),
}).superRefine((v, ctx) => {
  const cats = v.categoryLimits.map((c) => c.category);
  if (new Set(cats).size !== cats.length) ctx.addIssue({ code: 'custom', path: ['categoryLimits'], message: 'Duplicate category in budget' });
  if (v.overallLimit == null && v.categoryLimits.length === 0) ctx.addIssue({ code: 'custom', path: ['overallLimit'], message: 'Set an overall limit or at least one category limit' });
});
export const budgetUpdateSchema = budgetSchema; // full replacement; month may not change (enforced in controller)
export const budgetStatusQuery = z.object({ month: monthStr.optional() }).strict();

// ---- goals ----
export const goalSchema = strictObj({
  title: z.string().trim().min(1, 'Title is required').max(100),
  description: z.string().trim().max(500).optional().default(''),
  target: money,
  targetDate: dayStr,
});
export const contributionSchema = strictObj({
  amount: money,
  date: dayStr.optional(),
  note: z.string().trim().max(200).optional().default(''),
});
