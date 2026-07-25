const { z } = require('zod');

const ALLOWED_PAYMENT_METHODS = [
  'cash',
  'upi',
  'debit_card',
  'credit_card',
  'bank_transfer',
];

const createRecurringSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  paymentMethod: z.enum(ALLOWED_PAYMENT_METHODS, {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  type: z.enum(['income', 'expense']),
  frequency: z.enum(['weekly', 'monthly']),
  nextDueDate: z.string().datetime({ offset: true }).or(z.string().date()),
  note: z.string().max(255).optional().nullable(),
});

const patchRecurringSchema = z.object({
  active: z.boolean().optional(),
  amount: z.number().positive().optional(),
  paymentMethod: z.enum(ALLOWED_PAYMENT_METHODS).optional(),
  frequency: z.enum(['weekly', 'monthly']).optional(),
  nextDueDate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  note: z.string().max(255).optional().nullable(),
});

const upsertBudgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  monthlyLimit: z.number().positive('Limit must be greater than 0'),
});

const createGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100),
  targetAmount: z.number().positive('Target amount must be greater than 0'),
  targetDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
});

const contributeGoalSchema = z.object({
  amount: z.number().positive('Contribution amount must be greater than 0'),
  paymentMethod: z.enum(ALLOWED_PAYMENT_METHODS, {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
});

module.exports = {
  createRecurringSchema,
  patchRecurringSchema,
  upsertBudgetSchema,
  createGoalSchema,
  contributeGoalSchema,
};
