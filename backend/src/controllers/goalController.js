const defaultSupabase = require('../config/supabase');

const getGoals = async (req, res) => {
  try {
    const userId = req.user.userId;
    const supabase = req.supabase || defaultSupabase;

    const { data: goals, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch goals error:', error);
      return res.status(500).json({ error: 'Failed to fetch savings goals' });
    }

    const formattedGoals = (goals || []).map((g) => {
      const target = g.target_amount / 100;
      const current = g.current_amount / 100;
      const remaining = Math.max(0, target - current);
      const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

      return {
        id: g.id,
        name: g.name,
        targetAmount: target,
        currentAmount: current,
        remaining,
        percentage,
        targetDate: g.target_date,
        status: g.status,
        createdAt: g.created_at,
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
    const supabase = req.supabase || defaultSupabase;
    const { name, targetAmount, targetDate } = req.body;

    const targetInCents = Math.round(targetAmount * 100);
    const parsedTargetDate = targetDate ? new Date(targetDate).toISOString() : null;

    const { data: goal, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: userId,
        name: name.trim(),
        target_amount: targetInCents,
        current_amount: 0,
        target_date: parsedTargetDate,
        status: 'active',
      })
      .select()
      .single();

    if (error || !goal) {
      console.error('Create goal error:', error);
      return res.status(500).json({ error: 'Failed to create savings goal' });
    }

    return res.status(201).json({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.target_amount / 100,
      currentAmount: 0,
      remaining: goal.target_amount / 100,
      percentage: 0,
      targetDate: goal.target_date,
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
    const supabase = req.supabase || defaultSupabase;
    const { id } = req.params;
    const { amount, paymentMethod } = req.body;

    const { data: goal, error: fetchErr } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !goal) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }

    const contribCents = Math.round(amount * 100);
    const newCurrentAmount = goal.current_amount + contribCents;
    const newStatus = newCurrentAmount >= goal.target_amount ? 'achieved' : goal.status;

    // 1. Update Goal currentAmount & status
    const { data: updatedGoal, error: updateErr } = await supabase
      .from('savings_goals')
      .update({
        current_amount: newCurrentAmount,
        status: newStatus,
      })
      .eq('id', goal.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateErr) {
      console.error('Update goal error:', updateErr);
      return res.status(500).json({ error: 'Failed to update savings goal' });
    }

    // 2. Create linked Expense Transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'expense',
      amount: contribCents,
      category: `Savings: ${goal.name}`,
      payment_method: paymentMethod,
      note: `Contribution to ${goal.name}`,
      linked_goal_id: goal.id,
      date: new Date().toISOString(),
    });

    return res.status(200).json({
      id: updatedGoal.id,
      name: updatedGoal.name,
      currentAmount: updatedGoal.current_amount / 100,
      targetAmount: updatedGoal.target_amount / 100,
      remaining: Math.max(0, (updatedGoal.target_amount - updatedGoal.current_amount) / 100),
      percentage: Math.min(100, Math.round((updatedGoal.current_amount / updatedGoal.target_amount) * 100)),
      status: updatedGoal.status,
    });
  } catch (error) {
    console.error('Contribute goal error:', error);
    return res.status(500).json({ error: 'Failed to record goal contribution' });
  }
};

const deleteGoal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const supabase = req.supabase || defaultSupabase;
    const { id } = req.params;

    const { data: goal, error: fetchErr } = await supabase
      .from('savings_goals')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !goal) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }

    await supabase
      .from('transactions')
      .update({ linked_goal_id: null })
      .eq('linked_goal_id', goal.id)
      .eq('user_id', userId);

    const { error: deleteErr } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', goal.id)
      .eq('user_id', userId);

    if (deleteErr) {
      console.error('Delete goal error:', deleteErr);
      return res.status(500).json({ error: 'Failed to delete savings goal' });
    }

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
