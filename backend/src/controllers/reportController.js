const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

const getReportSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month } = req.query; // YYYY-MM format

    let startDate, endDate;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split('-').map(Number);
      startDate = new Date(year, m - 1, 1);
      endDate = new Date(year, m, 0, 23, 59, 59, 999);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const matchStage = {
      userId: new mongoose.Types.ObjectId(userId),
      date: { $gte: startDate, $lte: endDate },
    };

    // Aggregation 1: Spending by Category (Expenses only)
    const categoryResult = await Transaction.aggregate([
      { $match: { ...matchStage, type: 'expense' } },
      {
        $group: {
          _id: '$category',
          totalAmountInCents: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmountInCents: -1 } },
    ]);

    // Aggregation 2: Spending by Payment Method (Expenses only)
    const paymentMethodResult = await Transaction.aggregate([
      { $match: { ...matchStage, type: 'expense' } },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmountInCents: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmountInCents: -1 } },
    ]);

    // Aggregation 3: Total Income vs Total Expense for month
    const totalResult = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          totalInCents: { $sum: '$amount' },
        },
      },
    ]);

    let monthIncomeCents = 0;
    let monthExpenseCents = 0;
    totalResult.forEach((t) => {
      if (t._id === 'income') monthIncomeCents = t.totalInCents;
      if (t._id === 'expense') monthExpenseCents = t.totalInCents;
    });

    const categorySpending = categoryResult.map((item) => ({
      category: item._id,
      amount: item.totalAmountInCents / 100,
      count: item.count,
    }));

    const paymentMethodSpending = paymentMethodResult.map((item) => ({
      paymentMethod: item._id,
      amount: item.totalAmountInCents / 100,
      count: item.count,
    }));

    return res.status(200).json({
      period: {
        startDate,
        endDate,
        monthString: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
      },
      totals: {
        income: monthIncomeCents / 100,
        expense: monthExpenseCents / 100,
        net: (monthIncomeCents - monthExpenseCents) / 100,
      },
      categorySpending,
      paymentMethodSpending,
    });
  } catch (error) {
    console.error('Report summary error:', error);
    return res.status(500).json({ error: 'Failed to compute report summary' });
  }
};

module.exports = {
  getReportSummary,
};
