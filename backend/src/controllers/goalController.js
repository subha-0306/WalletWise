const SavingsGoal = require('../models/SavingsGoal');
const Transaction = require('../models/Transaction');

const getGoals = async (req, res) => {
  try {
    const userId = req.user.userId;

    const goals = await SavingsGoal.find({ userId }).sort({ createdAt: -1 }).lean();

    const formattedGoals = goals.map((g) => {
      const target = g.targetAmount / 100;
      const current = g.currentAmount / 100;
      const remaining = Math.max(0, target - current);
      const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

      return {
        id: g._id.toString(),
        name: g.name,
        targetAmount: target,
        currentAmount: current,
        remaining,
        percentage,
        targetDate: g.targetDate,
        status: g.status,
        createdAt: g.createdAt,
      };
    });

    const activeGoals = formattedGoals.filter((g) => g.status === 'active');
    const achievedGoals = formattedGoals.filter((g) => g.status === 'achieved');

    return res.status(200).json({
      active: activeGoals,
      achieved: achievedGoals,
    });
  } catch (error) {
    console.error('Get goals error:', error);
    return res.status(500).json({ error: 'Failed to fetch savings goals' });
  }
};

const createGoal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, targetAmount, targetDate } = req.body;

    const targetInCents = Math.round(targetAmount * 100);
    const parsedTargetDate = targetDate ? new Date(targetDate) : null;

    const goal = await SavingsGoal.create({
      userId,
      name: name.trim(),
      targetAmount: targetInCents,
      currentAmount: 0,
      targetDate: parsedTargetDate,
      status: 'active',
    });

    return res.status(201).json({
      id: goal._id.toString(),
      name: goal.name,
      targetAmount: goal.targetAmount / 100,
      currentAmount: 0,
      remaining: goal.targetAmount / 100,
      percentage: 0,
      targetDate: goal.targetDate,
      status: goal.status,
    });
  } catch (error) {
    console.error('Create goal error:', error);
    return res.status(500).json({ error: 'Failed to create savings goal' });
  }
};

const contributeGoal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { amount, paymentMethod } = req.body;

    const goal = await SavingsGoal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }

    const contribCents = Math.round(amount * 100);

    // 1. Update Goal currentAmount
    goal.currentAmount += contribCents;

    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'achieved';
    }

    await goal.save();

    // 2. Create linked Expense Transaction
    await Transaction.create({
      userId,
      type: 'expense',
      amount: contribCents,
      category: `Savings: ${goal.name}`,
      paymentMethod,
      note: `Contribution to ${goal.name}`,
      linkedGoalId: goal._id,
      date: new Date(),
    });

    return res.status(200).json({
      id: goal._id.toString(),
      name: goal.name,
      currentAmount: goal.currentAmount / 100,
      targetAmount: goal.targetAmount / 100,
      remaining: Math.max(0, (goal.targetAmount - goal.currentAmount) / 100),
      percentage: Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)),
      status: goal.status,
    });
  } catch (error) {
    console.error('Contribute goal error:', error);
    return res.status(500).json({ error: 'Failed to record goal contribution' });
  }
};

const deleteGoal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const goal = await SavingsGoal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }

    // Option A: Unlink linked goal transactions so historical spending records remain accurate
    await Transaction.updateMany({ linkedGoalId: goal._id, userId }, { $set: { linkedGoalId: null } });

    // Delete Goal container
    await SavingsGoal.deleteOne({ _id: id, userId });

    return res.status(200).json({ message: 'Savings goal deleted', id });
  } catch (error) {
    console.error('Delete goal error:', error);
    return res.status(500).json({ error: 'Failed to delete savings goal' });
  }
};

module.exports = {
  getGoals,
  createGoal,
  contributeGoal,
  deleteGoal,
};
