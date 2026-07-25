const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    personName: {
      type: String,
      required: [true, 'Person name is required'],
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
    direction: {
      type: String,
      enum: ['lent', 'borrowed'],
      required: [true, 'Direction (lent or borrowed) is required'],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'settled'],
      default: 'pending',
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
    settledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model('Loan', loanSchema);
