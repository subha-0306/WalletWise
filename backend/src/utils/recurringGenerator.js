const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');

const processRecurringTransactions = async (userId) => {
  try {
    const now = new Date();

    // Find active recurring templates due today or earlier
    const dueItems = await RecurringTransaction.find({
      userId,
      active: true,
      nextDueDate: { $lte: now },
    });

    if (!dueItems || dueItems.length === 0) {
      return;
    }

    for (const item of dueItems) {
      // Loop safety limit in case an item is far in the past (max 24 iterations per read)
      let iterations = 0;

      while (item.nextDueDate <= now && iterations < 24) {
        iterations++;

        // 1. Create real Transaction for occurrence
        await Transaction.create({
          userId: item.userId,
          type: item.type,
          amount: item.amount,
          category: item.category,
          paymentMethod: item.paymentMethod,
          note: item.note ? item.note : `Recurring: ${item.category}`,
          date: new Date(item.nextDueDate),
        });

        // 2. Advance nextDueDate by frequency interval
        const currentDueDate = new Date(item.nextDueDate);
        if (item.frequency === 'weekly') {
          currentDueDate.setDate(currentDueDate.getDate() + 7);
        } else if (item.frequency === 'monthly') {
          currentDueDate.setMonth(currentDueDate.getMonth() + 1);
        }
        item.nextDueDate = currentDueDate;
      }

      await item.save();
    }
  } catch (error) {
    console.error('Error processing recurring transactions on read:', error);
  }
};

module.exports = {
  processRecurringTransactions,
};
