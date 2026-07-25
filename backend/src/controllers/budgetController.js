const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

const getBudgets = async (req, res) => {
  try {
    const userId = req.user.userId;

    const budgets = await Budget.find({ userId }).sort({ category: 1 }).lean();

    // Calculate current month date range
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Aggregate current month expense spend per category
    const spendAggregation = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpentCents: { $sum: '$amount' },
        },
      },
    ]);

    const spendMap = {};
    spendAggregation.forEach((s) => {
      spendMap[s._id] = s.totalSpentCents / 100;
    });

    const formattedBudgets = budgets.map((b) => {
      const spent = spendMap[b.category] || 0;
      const limit = b.monthlyLimit / 100;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

      return {
        id: b._id.toString(),
        category: b.category,
        monthlyLimit: limit,
        monthlyLimitInCents: b.monthlyLimit,
        spentThisMonth: spent,
        percentage,
      };
    });

    return res.status(200).json({ budgets: formattedBudgets });
  } catch (error) {
    console.error('Get budgets error:', error);
    return res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

const upsertBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category, monthlyLimit } = req.body;

    const limitInCents = Math.round(monthlyLimit * 100);

    const budget = await Budget.findOneAndUpdate(
      { userId, category: category.trim() },
      { monthlyLimit: limitInCents },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      id: budget._id.toString(),
      category: budget.category,
      monthlyLimit: budget.monthlyLimit / 100,
    });
  } catch (error) {
    console.error('Upsert budget error:', error);
    return res.status(500).json({ error: 'Failed to set budget limit' });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const budget = await Budget.findOne({ _id: id, userId });
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await Budget.deleteOne({ _id: id, userId });

    return res.status(200).json({ message: 'Budget removed', id });
  } catch (error) {
    console.error('Delete budget error:', error);
    return res.status(500).json({ error: 'Failed to delete budget' });
  }
};

module.exports = {
  getBudgets,
  upsertBudget,
  deleteBudget,
};
