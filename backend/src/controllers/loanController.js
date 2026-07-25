const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');

const getLoans = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const loans = await Loan.find(query).sort({ createdAt: -1 }).lean();

    const formattedLoans = loans.map((l) => ({
      id: l._id.toString(),
      personName: l.personName,
      amount: l.amount / 100,
      amountInCents: l.amount,
      direction: l.direction,
      dueDate: l.dueDate,
      status: l.status,
      note: l.note || '',
      createdAt: l.createdAt,
      settledAt: l.settledAt,
    }));

    // Calculate totals for pending loans
    const pendingLoans = formattedLoans.filter((l) => l.status === 'pending');
    const settledLoans = formattedLoans.filter((l) => l.status === 'settled');

    let totalLentCents = 0;
    let totalBorrowedCents = 0;

    pendingLoans.forEach((l) => {
      if (l.direction === 'lent') {
        totalLentCents += l.amountInCents;
      } else if (l.direction === 'borrowed') {
        totalBorrowedCents += l.amountInCents;
      }
    });

    return res.status(200).json({
      pending: pendingLoans,
      settled: settledLoans,
      summary: {
        totalLentPending: totalLentCents / 100,
        totalBorrowedPending: totalBorrowedCents / 100,
      },
    });
  } catch (error) {
    console.error('Get loans error:', error);
    return res.status(500).json({ error: 'Failed to fetch loans' });
  }
};

const createLoan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { personName, amount, direction, paymentMethod, dueDate, note } = req.body;

    const amountInCents = Math.round(amount * 100);
    const parsedDueDate = dueDate ? new Date(dueDate) : null;

    // 1. Create Loan
    const loan = await Loan.create({
      userId,
      personName: personName.trim(),
      amount: amountInCents,
      direction,
      dueDate: parsedDueDate,
      note: note ? note.trim() : '',
    });

    // 2. Create linked Transaction
    // "lent" loan -> money left wallet (expense)
    // "borrowed" loan -> money entered wallet (income)
    const transactionType = direction === 'lent' ? 'expense' : 'income';
    const category = direction === 'lent' ? 'Lent' : 'Borrowed';
    const txNote = direction === 'lent' 
      ? `Lent to ${personName.trim()}${note ? `: ${note.trim()}` : ''}`
      : `Borrowed from ${personName.trim()}${note ? `: ${note.trim()}` : ''}`;

    await Transaction.create({
      userId,
      type: transactionType,
      amount: amountInCents,
      category,
      paymentMethod,
      note: txNote,
      linkedLoanId: loan._id,
      date: new Date(),
    });

    return res.status(201).json({
      id: loan._id.toString(),
      personName: loan.personName,
      amount: loan.amount / 100,
      amountInCents: loan.amount,
      direction: loan.direction,
      dueDate: loan.dueDate,
      status: loan.status,
      note: loan.note,
      createdAt: loan.createdAt,
    });
  } catch (error) {
    console.error('Create loan error:', error);
    return res.status(500).json({ error: 'Failed to create loan' });
  }
};

const settleLoan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const loan = await Loan.findOne({ _id: id, userId });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found or unauthorized' });
    }

    if (loan.status === 'settled') {
      return res.status(400).json({ error: 'Loan is already settled' });
    }

    // Determine payment method for reverse transaction
    // Use provided paymentMethod or fallback to paymentMethod of original linked transaction
    let settlePaymentMethod = paymentMethod;
    if (!settlePaymentMethod) {
      const originalTx = await Transaction.findOne({ linkedLoanId: loan._id, userId });
      settlePaymentMethod = originalTx ? originalTx.paymentMethod : 'cash';
    }

    // Mark loan settled
    loan.status = 'settled';
    loan.settledAt = new Date();
    await loan.save();

    // Create reverse transaction
    // If original loan was "lent" (expense), settlement is money coming back -> Income
    // If original loan was "borrowed" (income), settlement is paying back -> Expense
    const reverseType = loan.direction === 'lent' ? 'income' : 'expense';
    const reverseCategory = loan.direction === 'lent' ? 'Lent' : 'Borrowed';
    const reverseNote = loan.direction === 'lent'
      ? `Settled loan: Received from ${loan.personName}`
      : `Settled loan: Paid to ${loan.personName}`;

    await Transaction.create({
      userId,
      type: reverseType,
      amount: loan.amount,
      category: reverseCategory,
      paymentMethod: settlePaymentMethod,
      note: reverseNote,
      linkedLoanId: loan._id,
      date: new Date(),
    });

    return res.status(200).json({
      message: 'Loan marked as settled',
      id: loan._id.toString(),
      status: loan.status,
      settledAt: loan.settledAt,
    });
  } catch (error) {
    console.error('Settle loan error:', error);
    return res.status(500).json({ error: 'Failed to settle loan' });
  }
};

const deleteLoan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const loan = await Loan.findOne({ _id: id, userId });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found or unauthorized' });
    }

    // 1. Unlink linked transactions (preserve historical transaction history and wallet balances)
    await Transaction.updateMany({ linkedLoanId: loan._id, userId }, { $set: { linkedLoanId: null } });

    // 2. Delete Loan document
    await Loan.deleteOne({ _id: id, userId });

    return res.status(200).json({ message: 'Loan deleted and transactions unlinked', id });
  } catch (error) {
    console.error('Delete loan error:', error);
    return res.status(500).json({ error: 'Failed to delete loan' });
  }
};

module.exports = {
  getLoans,
  createLoan,
  settleLoan,
  deleteLoan,
};
