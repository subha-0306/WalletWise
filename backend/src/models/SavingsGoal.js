const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be greater than zero'],
      validate: {
        validator: Number.isInteger,
        message: 'Target amount must be stored as an integer in smallest currency unit',
      },
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Current amount must be stored as an integer in smallest currency unit',
      },
    },
    targetDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'achieved'],
      default: 'active',
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

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
