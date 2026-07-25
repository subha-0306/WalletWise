const RecurringTransaction = require('../models/RecurringTransaction');
const { processRecurringTransactions } = require('../utils/recurringGenerator');

const getRecurring = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Auto-process due recurring items first
    await processRecurringTransactions(userId);

    const items = await RecurringTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = items.map((r) => ({
      id: r._id.toString(),
      category: r.category,
      amount: r.amount / 100,
      amountInCents: r.amount,
      paymentMethod: r.paymentMethod,
      type: r.type,
      frequency: r.frequency,
      nextDueDate: r.nextDueDate,
      active: r.active,
      note: r.note || '',
      createdAt: r.createdAt,
    }));

    return res.status(200).json({ recurring: formatted });
  } catch (error) {
    console.error('Get recurring error:', error);
    return res.status(500).json({ error: 'Failed to fetch recurring transactions' });
  }
};

const createRecurring = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category, amount, paymentMethod, type, frequency, nextDueDate, note } = req.body;

    const amountInCents = Math.round(amount * 100);
    const parsedNextDueDate = new Date(nextDueDate);

    const item = await RecurringTransaction.create({
      userId,
      category: category.trim(),
      amount: amountInCents,
      paymentMethod,
      type,
      frequency,
      nextDueDate: parsedNextDueDate,
      note: note ? note.trim() : '',
      active: true,
    });

    // Check if immediately due upon creation
    await processRecurringTransactions(userId);

    return res.status(201).json({
      id: item._id.toString(),
      category: item.category,
      amount: item.amount / 100,
      paymentMethod: item.paymentMethod,
      type: item.type,
      frequency: item.frequency,
      nextDueDate: item.nextDueDate,
      active: item.active,
      note: item.note,
    });
  } catch (error) {
    console.error('Create recurring error:', error);
    return res.status(500).json({ error: 'Failed to create recurring transaction' });
  }
};

const patchRecurring = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const updateData = req.body;

    const item = await RecurringTransaction.findOne({ _id: id, userId });
    if (!item) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    if (updateData.active !== undefined) item.active = updateData.active;
    if (updateData.amount !== undefined) item.amount = Math.round(updateData.amount * 100);
    if (updateData.paymentMethod) item.paymentMethod = updateData.paymentMethod;
    if (updateData.frequency) item.frequency = updateData.frequency;
    if (updateData.nextDueDate) item.nextDueDate = new Date(updateData.nextDueDate);
    if (updateData.note !== undefined) item.note = updateData.note ? updateData.note.trim() : '';

    await item.save();

    return res.status(200).json({
      id: item._id.toString(),
      category: item.category,
      amount: item.amount / 100,
      paymentMethod: item.paymentMethod,
      type: item.type,
      frequency: item.frequency,
      nextDueDate: item.nextDueDate,
      active: item.active,
      note: item.note,
    });
  } catch (error) {
    console.error('Patch recurring error:', error);
    return res.status(500).json({ error: 'Failed to update recurring transaction' });
  }
};

const deleteRecurring = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const item = await RecurringTransaction.findOne({ _id: id, userId });
    if (!item) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    // Delete template (does not delete transactions already generated)
    await RecurringTransaction.deleteOne({ _id: id, userId });

    return res.status(200).json({ message: 'Recurring transaction deleted', id });
  } catch (error) {
    console.error('Delete recurring error:', error);
    return res.status(500).json({ error: 'Failed to delete recurring transaction' });
  }
};

module.exports = {
  getRecurring,
  createRecurring,
  patchRecurring,
  deleteRecurring,
};
