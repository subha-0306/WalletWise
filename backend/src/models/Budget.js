const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
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
    monthlyLimit: {
      type: Number,
      required: [true, 'Monthly limit is required'],
      min: [1, 'Limit must be greater than zero'],
      validate: {
        validator: Number.isInteger,
        message: 'Limit must be stored as an integer in smallest currency unit',
      },
    },
  },
  {
    timestamps: false,
  }
);

// Compound unique index so each user can have at most one budget limit per category
budgetSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
