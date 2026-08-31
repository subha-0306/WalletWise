const defaultSupabase = require('../config/supabase');
const { processRecurringTransactions } = require('../utils/recurringGenerator');

const getRecurring = async (req, res) => {
  try {
    const userId = req.user.userId;
    const supabase = req.supabase || defaultSupabase;
    
    // Auto-process due recurring items first
    await processRecurringTransactions(userId, supabase);

    const { data: items, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch recurring transactions error:', error);
      return res.status(500).json({ error: 'Failed to fetch recurring transactions' });
    }

    const formatted = (items || []).map((r) => ({
      id: r.id,
      category: r.category,
      amount: r.amount / 100,
      amountInCents: r.amount,
      paymentMethod: r.payment_method,
      type: r.type,
      frequency: r.frequency,
      nextDueDate: r.next_due_date,
      active: r.active,
      note: r.note || '',
      createdAt: r.created_at,
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
    const supabase = req.supabase || defaultSupabase;
    const { category, amount, paymentMethod, type, frequency, nextDueDate, note } = req.body;

    const amountInCents = Math.round(amount * 100);
    const parsedNextDueDate = new Date(nextDueDate).toISOString();

    const { data: item, error } = await supabase
      .from('recurring_transactions')
      .insert({
        user_id: userId,
        category: category.trim(),
        amount: amountInCents,
        payment_method: paymentMethod,
        type,
        frequency,
        next_due_date: parsedNextDueDate,
        note: note ? note.trim() : '',
        active: true,
      })
      .select()
      .single();

    if (error || !item) {
      console.error('Create recurring error:', error);
      return res.status(500).json({ error: 'Failed to create recurring transaction' });
    }

    await processRecurringTransactions(userId, supabase);

    return res.status(201).json({
      id: item.id,
      category: item.category,
      amount: item.amount / 100,
      paymentMethod: item.payment_method,
      type: item.type,
      frequency: item.frequency,
      nextDueDate: item.next_due_date,
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
    const supabase = req.supabase || defaultSupabase;
    const { id } = req.params;
    const updateData = req.body;

    const { data: existing, error: fetchErr } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    const updates = {};
    if (updateData.active !== undefined) updates.active = updateData.active;
    if (updateData.amount !== undefined) updates.amount = Math.round(updateData.amount * 100);
    if (updateData.paymentMethod) updates.payment_method = updateData.paymentMethod;
    if (updateData.frequency) updates.frequency = updateData.frequency;
    if (updateData.nextDueDate) updates.next_due_date = new Date(updateData.nextDueDate).toISOString();
    if (updateData.note !== undefined) updates.note = updateData.note ? updateData.note.trim() : '';

    const { data: item, error: updateErr } = await supabase
      .from('recurring_transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateErr) {
      console.error('Patch recurring error:', updateErr);
      return res.status(500).json({ error: 'Failed to update recurring transaction' });
    }

    return res.status(200).json({
      id: item.id,
      category: item.category,
      amount: item.amount / 100,
      paymentMethod: item.payment_method,
      type: item.type,
      frequency: item.frequency,
      nextDueDate: item.next_due_date,
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
    const supabase = req.supabase || defaultSupabase;
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('recurring_transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    const { error: deleteErr } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteErr) {
      console.error('Delete recurring error:', deleteErr);
      return res.status(500).json({ error: 'Failed to delete recurring transaction' });
    }

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
