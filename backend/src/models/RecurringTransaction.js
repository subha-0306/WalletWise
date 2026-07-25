const mongoose = require('mongoose');

const recurringTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than zero'],
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be stored as an integer in smallest currency unit',
      },
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'debit_card', 'credit_card', 'bank_transfer'],
      required: [true, 'Payment method is required'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Type is required'],
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: [true, 'Frequency is required'],
    },
    nextDueDate: {
      type: Date,
      required: [true, 'Next due date is required'],
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model('RecurringTransaction', recurringTransactionSchema);
