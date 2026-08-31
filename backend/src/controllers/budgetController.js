const defaultSupabase = require('../config/supabase');

const getBudgets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const supabase = req.supabase || defaultSupabase;

    const { data: budgets, error: budgetErr } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('category', { ascending: true });

    if (budgetErr) {
      console.error('Fetch budgets error:', budgetErr);
      return res.status(500).json({ error: 'Failed to fetch budgets' });
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const { data: transactions, error: txErr } = await supabase
      .from('transactions')
      .select('category, amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate);

    if (txErr) {
      console.error('Fetch budget transactions error:', txErr);
      return res.status(500).json({ error: 'Failed to fetch budget usage' });
    }

    const spendMap = {};
    (transactions || []).forEach((t) => {
      spendMap[t.category] = (spendMap[t.category] || 0) + (t.amount / 100);
    });

    const formattedBudgets = (budgets || []).map((b) => {
      const spent = spendMap[b.category] || 0;
      const limit = b.monthly_limit / 100;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

      return {
        id: b.id,
        category: b.category,
        monthlyLimit: limit,
        monthlyLimitInCents: b.monthly_limit,
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
    const supabase = req.supabase || defaultSupabase;
    const { category, monthlyLimit } = req.body;

    const limitInCents = Math.round(monthlyLimit * 100);
    const catName = category.trim();

    const { data: existing } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('category', catName)
      .single();

    let budget;
    if (existing) {
      const { data: updated, error: updateErr } = await supabase
        .from('budgets')
        .update({ monthly_limit: limitInCents })
        .eq('id', existing.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateErr) {
        console.error('Update budget error:', updateErr);
        return res.status(500).json({ error: 'Failed to update budget' });
      }
      budget = updated;
    } else {
      const { data: created, error: createErr } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          category: catName,
          monthly_limit: limitInCents,
        })
        .select()
        .single();

      if (createErr) {
        console.error('Create budget error:', createErr);
        return res.status(500).json({ error: 'Failed to create budget' });
      }
      budget = created;
    }

    return res.status(200).json({
      id: budget.id,
      category: budget.category,
      monthlyLimit: budget.monthly_limit / 100,
    });
  } catch (error) {
    console.error('Upsert budget error:', error);
    return res.status(500).json({ error: 'Failed to set budget limit' });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const supabase = req.supabase || defaultSupabase;
    const { id } = req.params;

    const { data: budget, error: fetchErr } = await supabase
      .from('budgets')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    const { error: deleteErr } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteErr) {
      console.error('Delete budget error:', deleteErr);
      return res.status(500).json({ error: 'Failed to delete budget' });
    }

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
