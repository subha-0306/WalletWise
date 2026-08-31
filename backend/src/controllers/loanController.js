const defaultSupabase = require('../config/supabase');

const getLoans = async (req, res) => {
  try {
    const userId = req.user.userId;
    const supabase = req.supabase || defaultSupabase;
    const { status } = req.query;

    let query = supabase
      .from('loans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: loans, error } = await query;

    if (error) {
      console.error('Fetch loans error:', error);
      return res.status(500).json({ error: 'Failed to fetch loans' });
    }

    const formattedLoans = (loans || []).map((l) => ({
      id: l.id,
      personName: l.person_name,
      amount: l.amount / 100,
      amountInCents: l.amount,
      direction: l.direction,
      dueDate: l.due_date,
      status: l.status,
      note: l.note || '',
      createdAt: l.created_at,
      settledAt: l.settled_at,
    }));

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
    const supabase = req.supabase || defaultSupabase;
    const { personName, amount, direction, paymentMethod, dueDate, note } = req.body;

    const amountInCents = Math.round(amount * 100);
    const parsedDueDate = dueDate ? new Date(dueDate).toISOString() : null;

    // 1. Create Loan
    const { data: loan, error: loanErr } = await supabase
      .from('loans')
      .insert({
        user_id: userId,
        person_name: personName.trim(),
        amount: amountInCents,
        direction,
        due_date: parsedDueDate,
        note: note ? note.trim() : '',
        status: 'pending',
      })
      .select()
      .single();

    if (loanErr || !loan) {
      console.error('Create loan error:', loanErr);
      return res.status(500).json({ error: 'Failed to create loan', details: loanErr?.message });
    }

    // 2. Create linked Transaction
    const transactionType = direction === 'lent' ? 'expense' : 'income';
    const category = direction === 'lent' ? 'Lent' : 'Borrowed';
    const txNote = direction === 'lent' 
      ? `Lent to ${personName.trim()}${note ? `: ${note.trim()}` : ''}`
      : `Borrowed from ${personName.trim()}${note ? `: ${note.trim()}` : ''}`;

    await supabase.from('transactions').insert({
      user_id: userId,
      type: transactionType,
      amount: amountInCents,
      category,
      payment_method: paymentMethod,
      note: txNote,
      linked_loan_id: loan.id,
      date: new Date().toISOString(),
    });

    return res.status(201).json({
      id: loan.id,
      personName: loan.person_name,
      amount: loan.amount / 100,
      amountInCents: loan.amount,
      direction: loan.direction,
      dueDate: loan.due_date,
      status: loan.status,
      note: loan.note,
      createdAt: loan.created_at,
    });
  } catch (error) {
    console.error('Create loan error:', error);
    return res.status(500).json({ error: 'Failed to create loan' });
  }
};

const settleLoan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const supabase = req.supabase || defaultSupabase;
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const { data: loan, error: fetchErr } = await supabase
      .from('loans')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !loan) {
      return res.status(404).json({ error: 'Loan not found or unauthorized' });
    }

    if (loan.status === 'settled') {
      return res.status(400).json({ error: 'Loan is already settled' });
    }

    let settlePaymentMethod = paymentMethod;
    if (!settlePaymentMethod) {
      const { data: originalTx } = await supabase
        .from('transactions')
        .select('payment_method')
        .eq('linked_loan_id', loan.id)
        .eq('user_id', userId)
        .limit(1)
        .single();

      settlePaymentMethod = originalTx ? originalTx.payment_method : 'cash';
    }

    const settledAt = new Date().toISOString();

    const { data: updatedLoan, error: updateErr } = await supabase
      .from('loans')
      .update({
        status: 'settled',
        settled_at: settledAt,
      })
      .eq('id', loan.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateErr) {
      console.error('Settle loan update error:', updateErr);
      return res.status(500).json({ error: 'Failed to settle loan' });
    }

    const reverseType = loan.direction === 'lent' ? 'income' : 'expense';
    const reverseCategory = loan.direction === 'lent' ? 'Lent' : 'Borrowed';
    const reverseNote = loan.direction === 'lent'
      ? `Settled loan: Received from ${loan.person_name}`
      : `Settled loan: Paid to ${loan.person_name}`;

    await supabase.from('transactions').insert({
      user_id: userId,
      type: reverseType,
      amount: loan.amount,
      category: reverseCategory,
      payment_method: settlePaymentMethod,
      note: reverseNote,
      linked_loan_id: loan.id,
      date: new Date().toISOString(),
    });

    return res.status(200).json({
      message: 'Loan marked as settled',
      id: updatedLoan.id,
      status: updatedLoan.status,
      settledAt: updatedLoan.settled_at,
    });
  } catch (error) {
    console.error('Settle loan error:', error);
    return res.status(500).json({ error: 'Failed to settle loan' });
  }
};

const deleteLoan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const supabase = req.supabase || defaultSupabase;
    const { id } = req.params;

    const { data: loan, error: fetchErr } = await supabase
      .from('loans')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !loan) {
      return res.status(404).json({ error: 'Loan not found or unauthorized' });
    }

    // 1. Unlink transactions
    await supabase
      .from('transactions')
      .update({ linked_loan_id: null })
      .eq('linked_loan_id', loan.id)
      .eq('user_id', userId);

    // 2. Delete Loan
    const { error: deleteErr } = await supabase
      .from('loans')
      .delete()
      .eq('id', loan.id)
      .eq('user_id', userId);

    if (deleteErr) {
      console.error('Delete loan error:', deleteErr);
      return res.status(500).json({ error: 'Failed to delete loan' });
    }

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
