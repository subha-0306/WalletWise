const { z } = require('zod');

const ALLOWED_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Education',
  'Other',
  'Lent',
  'Borrowed',
];

const ALLOWED_PAYMENT_METHODS = [
  'cash',
  'upi',
  'debit_card',
  'credit_card',
  'bank_transfer',
];

const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Type must be either income or expense' }),
  }),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  paymentMethod: z.enum(ALLOWED_PAYMENT_METHODS, {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  note: z.string().max(255, 'Note cannot exceed 255 characters').optional().nullable(),
  date: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
});

const patchTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  paymentMethod: z.enum(ALLOWED_PAYMENT_METHODS).optional(),
  note: z.string().max(255).optional().nullable(),
  date: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
});

module.exports = {
  createTransactionSchema,
  patchTransactionSchema,
  ALLOWED_CATEGORIES,
  ALLOWED_PAYMENT_METHODS,
};
