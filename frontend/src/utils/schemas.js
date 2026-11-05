import { z } from 'zod';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS } from './constants.js';

const amount = (label = 'Amount') =>
  z.coerce.number({ invalid_type_error: `${label} must be a number` })
    .finite()
    .positive(`${label} must be greater than 0`)
    .max(1e9, `${label} is too large`)
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'At most 2 decimal places');
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date');

export const transactionFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Max 120 characters'),
  amount: amount(),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Choose a category'),
  date: day,
  paymentMethod: z.enum(PAYMENT_METHODS),
  notes: z.string().trim().max(500, 'Max 500 characters').optional(),
  tagsText: z.string().max(300).optional(),
}).superRefine((v, ctx) => {
  const list = v.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!list.includes(v.category)) ctx.addIssue({ code: 'custom', path: ['category'], message: `Choose a valid ${v.type} category` });
  const tags = (v.tagsText || '').split(',').map((t) => t.trim()).filter(Boolean);
  if (tags.length > 10 || tags.some((t) => t.length > 30)) ctx.addIssue({ code: 'custom', path: ['tagsText'], message: 'Up to 10 tags, 30 characters each' });
});

export const budgetFormSchema = z.object({
  overallLimit: z.union([z.literal(''), amount('Limit')]).optional(),
  categoryLimits: z.array(z.object({ category: z.enum(EXPENSE_CATEGORIES), limit: amount('Limit') })),
}).superRefine((v, ctx) => {
  const cats = v.categoryLimits.map((c) => c.category);
  if (new Set(cats).size !== cats.length) ctx.addIssue({ code: 'custom', path: ['categoryLimits'], message: 'Each category can only be used once' });
  if ((v.overallLimit === '' || v.overallLimit === undefined) && v.categoryLimits.length === 0) ctx.addIssue({ code: 'custom', path: ['overallLimit'], message: 'Set an overall limit or add a category limit' });
});

export const goalFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100),
  description: z.string().trim().max(500).optional(),
  target: amount('Target'),
  targetDate: day,
});
export const contributionFormSchema = z.object({
  amount: amount(),
  date: day,
  note: z.string().trim().max(200).optional(),
});

const password = z.string().min(8, 'At least 8 characters').max(72).regex(/[A-Za-z]/, 'Include a letter').regex(/\d/, 'Include a number');
export const loginFormSchema = z.object({ email: z.string().trim().email('Enter a valid email'), password: z.string().min(1, 'Password is required') });
export const registerFormSchema = z.object({
  name: z.string().trim().min(2, 'At least 2 characters').max(60),
  email: z.string().trim().email('Enter a valid email'),
  password,
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });
export const profileFormSchema = z.object({
  name: z.string().trim().min(2, 'At least 2 characters').max(60),
  openingBalance: z.coerce.number({ invalid_type_error: 'Enter a number' }).finite().min(-1e12).max(1e12),
});
export const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: password,
  confirm: z.string(),
}).refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });
