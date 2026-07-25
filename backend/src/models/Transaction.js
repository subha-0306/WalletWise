const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Transaction type is required'],
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
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'debit_card', 'credit_card', 'bank_transfer'],
      required: [true, 'Payment method is required'],
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    linkedLoanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      default: null,
      index: true,
    },
    linkedGoalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavingsGoal',
      default: null,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
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

module.exports = mongoose.model('Transaction', transactionSchema);
