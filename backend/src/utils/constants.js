export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment Returns', 'Gifts', 'Other Income'];
export const EXPENSE_CATEGORIES = [
  'Food', 'Groceries', 'Transport', 'Housing', 'Utilities', 'Healthcare',
  'Shopping', 'Entertainment', 'Education', 'Travel', 'Subscriptions', 'Other Expenses',
];
export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
export const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'];
export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'AED', 'SGD'];
export const THEMES = ['light', 'dark'];
export const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
// Categories treated as "discretionary" by the insights engine.
export const DISCRETIONARY = ['Food', 'Shopping', 'Entertainment', 'Travel', 'Subscriptions'];
