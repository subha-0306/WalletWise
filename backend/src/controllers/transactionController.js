const defaultSupabase = require('../config/supabase');
const { processRecurringTransactions } = require('../utils/recurringGenerator');

const getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const supabase = req.supabase || defaultSupabase;
    
    // Auto-process due recurring transactions on read
    await processRecurringTransactions(userId, supabase);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const { data: transactions, count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error('Fetch transactions error:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
    }

    const total = count || 0;
    const formattedTransactions = (transactions || []).map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount / 100,
      amountInCents: t.amount,
      category: t.category,
      paymentMethod: t.payment_method,
      note: t.note || '',
      linkedLoanId: t.linked_loan_id,
      linkedGoalId: t.linked_goal_id,
      affectsLinkedRecord: !!(t.linked_loan_id || t.linked_goal_id),
      date: t.date,
      createdAt: t.created_at,
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
    return res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
  }
};

const createTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const supabase = req.supabase || defaultSupabase;
    const { type, amount, category, paymentMethod, note, date } = req.body;

    const amountInCents = Math.round(amount * 100);
    const transactionDate = date ? new Date(date).toISOString() : new Date().toISOString();

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type,
        amount: amountInCents,
        category,
        payment_method: paymentMethod,
        note: note ? note.trim() : '',
        date: transactionDate,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert transaction error:', error);
      return res.status(500).json({ error: 'Failed to create transaction', details: error.message });
    }

    return res.status(201).json({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount / 100,
      amountInCents: transaction.amount,
      category: transaction.category,
      paymentMethod: transaction.payment_method,
      note: transaction.note,
      date: transaction.date,
      createdAt: transaction.created_at,
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({ error: 'Failed to create transaction', details: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const supabase = req.supabase || defaultSupabase;
    const { id } = req.params;
    const { type, amount, category, paymentMethod, note, date } = req.body;

    const { data: existingTx, error: fetchErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !existingTx) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    const updates = {};
    if (type) updates.type = type;
    if (amount !== undefined) updates.amount = Math.round(amount * 100);
    if (category) updates.category = category.trim();
    if (paymentMethod) updates.payment_method = paymentMethod;
    if (note !== undefined) updates.note = note ? note.trim() : '';
    if (date) updates.date = new Date(date).toISOString();

    const { data: updatedTx, error: updateErr } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateErr) {
      console.error('Update transaction error:', updateErr);
      return res.status(500).json({ error: 'Failed to update transaction', details: updateErr.message });
    }

    const isLinked = !!(updatedTx.linked_loan_id || updatedTx.linked_goal_id);

    return res.status(200).json({
      id: updatedTx.id,
      type: updatedTx.type,
      amount: updatedTx.amount / 100,
      amountInCents: updatedTx.amount,
      category: updatedTx.category,
      paymentMethod: updatedTx.payment_method,
      note: updatedTx.note,
      linkedLoanId: updatedTx.linked_loan_id,
      linkedGoalId: updatedTx.linked_goal_id,
      affectsLinkedRecord: isLinked,
      date: updatedTx.date,
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    return res.status(500).json({ error: 'Failed to update transaction', details: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const supabase = req.supabase || defaultSupabase;
    const { id } = req.params;

    const { data: transaction, error: fetchErr } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !transaction) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    const { error: deleteErr } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteErr) {
      console.error('Delete transaction error:', deleteErr);
      return res.status(500).json({ error: 'Failed to delete transaction', details: deleteErr.message });
    }

    return res.status(200).json({ message: 'Transaction deleted successfully', id });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return res.status(500).json({ error: 'Failed to delete transaction', details: error.message });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
