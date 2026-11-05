export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment Returns', 'Gifts', 'Other Income'];
export const EXPENSE_CATEGORIES = ['Food', 'Groceries', 'Transport', 'Housing', 'Utilities', 'Healthcare', 'Shopping', 'Entertainment', 'Education', 'Travel', 'Subscriptions', 'Other Expenses'];
export const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'];
export const CURRENCIES = [
  { code: 'INR', label: 'Indian Rupee (₹)' }, { code: 'USD', label: 'US Dollar ($)' }, { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' }, { code: 'JPY', label: 'Japanese Yen (¥)' }, { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' }, { code: 'AED', label: 'UAE Dirham (AED)' }, { code: 'SGD', label: 'Singapore Dollar (S$)' },
];
export const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
export const CHART_COLORS = ['#10b981', '#3b619f', '#f4586b', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b', '#14b8a6', '#a855f7'];
export const categoriesFor = (type) => (type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES);
