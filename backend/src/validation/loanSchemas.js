const { z } = require('zod');

const ALLOWED_PAYMENT_METHODS = [
  'cash',
  'upi',
  'debit_card',
  'credit_card',
  'bank_transfer',
];

const createLoanSchema = z.object({
  personName: z.string().min(1, 'Person name is required').max(100, 'Name is too long'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  direction: z.enum(['lent', 'borrowed'], {
    errorMap: () => ({ message: 'Direction must be lent or borrowed' }),
  }),
  paymentMethod: z.enum(ALLOWED_PAYMENT_METHODS, {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  note: z.string().max(255, 'Note cannot exceed 255 characters').optional().nullable(),
});

const settleLoanSchema = z.object({
  paymentMethod: z.enum(ALLOWED_PAYMENT_METHODS, {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }).optional(),
});

module.exports = {
  createLoanSchema,
  settleLoanSchema,
};
