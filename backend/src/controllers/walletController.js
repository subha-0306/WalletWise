const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { processRecurringTransactions } = require('../utils/recurringGenerator');

const ALL_PAYMENT_METHODS = [
  'cash',
  'upi',
  'debit_card',
  'credit_card',
  'bank_transfer',
];

const getWalletSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Auto-process due recurring items on read before computing balances
    await processRecurringTransactions(userId);

    const aggregationResult = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
        },
      },
      {
        $project: {
          paymentMethod: '$_id',
          balanceInCents: { $subtract: ['$totalIncome', '$totalExpense'] },
          incomeInCents: '$totalIncome',
          expenseInCents: '$totalExpense',
        },
      },
    ]);

    const summaryMap = {};
    aggregationResult.forEach((item) => {
      summaryMap[item.paymentMethod] = {
        balance: item.balanceInCents / 100,
        balanceInCents: item.balanceInCents,
        totalIncome: item.incomeInCents / 100,
        totalExpense: item.expenseInCents / 100,
      };
    });

    const methodsSummary = {};
    let totalAvailableInCents = 0;

    ALL_PAYMENT_METHODS.forEach((method) => {
      const data = summaryMap[method] || {
        balance: 0,
        balanceInCents: 0,
        totalIncome: 0,
        totalExpense: 0,
      };
      methodsSummary[method] = data;
      totalAvailableInCents += data.balanceInCents;
    });

    return res.status(200).json({
      totalAvailableBalance: totalAvailableInCents / 100,
      totalAvailableBalanceInCents: totalAvailableInCents,
      methods: methodsSummary,
    });
  } catch (error) {
    console.error('Wallet summary aggregation error:', error);
    return res.status(500).json({ error: 'Failed to compute wallet summary' });
  }
};

module.exports = {
  getWalletSummary,
};
