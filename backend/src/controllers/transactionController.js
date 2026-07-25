const Transaction = require('../models/Transaction');
const { processRecurringTransactions } = require('../utils/recurringGenerator');

const getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Auto-process due recurring transactions on read
    await processRecurringTransactions(userId);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await Transaction.countDocuments({ userId });
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedTransactions = transactions.map((t) => ({
      id: t._id.toString(),
      type: t.type,
      amount: t.amount / 100,
      amountInCents: t.amount,
      category: t.category,
      paymentMethod: t.paymentMethod,
      note: t.note || '',
      linkedLoanId: t.linkedLoanId,
      linkedGoalId: t.linkedGoalId,
      affectsLinkedRecord: !!(t.linkedLoanId || t.linkedGoalId),
      date: t.date,
      createdAt: t.createdAt,
    }));

    return res.status(200).json({
      transactions: formattedTransactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

const createTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, amount, category, paymentMethod, note, date } = req.body;

    const amountInCents = Math.round(amount * 100);
    const transactionDate = date ? new Date(date) : new Date();

    const transaction = await Transaction.create({
      userId,
      type,
      amount: amountInCents,
      category,
      paymentMethod,
      note: note ? note.trim() : '',
      date: transactionDate,
    });

    return res.status(201).json({
      id: transaction._id.toString(),
      type: transaction.type,
      amount: transaction.amount / 100,
      amountInCents: transaction.amount,
      category: transaction.category,
      paymentMethod: transaction.paymentMethod,
      note: transaction.note,
      date: transaction.date,
      createdAt: transaction.createdAt,
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({ error: 'Failed to create transaction' });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { type, amount, category, paymentMethod, note, date } = req.body;

    const transaction = await Transaction.findOne({ _id: id, userId });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    const isLinked = !!(transaction.linkedLoanId || transaction.linkedGoalId);

    if (type) transaction.type = type;
    if (amount !== undefined) transaction.amount = Math.round(amount * 100);
    if (category) transaction.category = category.trim();
    if (paymentMethod) transaction.paymentMethod = paymentMethod;
    if (note !== undefined) transaction.note = note ? note.trim() : '';
    if (date) transaction.date = new Date(date);

    await transaction.save();

    return res.status(200).json({
      id: transaction._id.toString(),
      type: transaction.type,
      amount: transaction.amount / 100,
      amountInCents: transaction.amount,
      category: transaction.category,
      paymentMethod: transaction.paymentMethod,
      note: transaction.note,
      linkedLoanId: transaction.linkedLoanId,
      linkedGoalId: transaction.linkedGoalId,
      affectsLinkedRecord: isLinked,
      date: transaction.date,
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    return res.status(500).json({ error: 'Failed to update transaction' });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const transaction = await Transaction.findOne({ _id: id, userId });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    await Transaction.deleteOne({ _id: id, userId });

    return res.status(200).json({ message: 'Transaction deleted successfully', id });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
