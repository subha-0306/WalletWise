const defaultSupabase = require('../config/supabase');

const processRecurringTransactions = async (userId, customClient) => {
  try {
    const supabase = customClient || defaultSupabase;
    const nowIso = new Date().toISOString();

    // Find active recurring templates due today or earlier
    const { data: dueItems, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .lte('next_due_date', nowIso);

    if (error) {
      console.error('Error fetching due recurring items:', error);
      return;
    }

    if (!dueItems || dueItems.length === 0) {
      return;
    }

    const now = new Date();

    for (const item of dueItems) {
      let iterations = 0;
      let currentDueDate = new Date(item.next_due_date);

      while (currentDueDate <= now && iterations < 24) {
        iterations++;

        // 1. Create real Transaction for occurrence
        const { error: txError } = await supabase.from('transactions').insert({
          user_id: item.user_id,
          type: item.type,
          amount: item.amount,
          category: item.category,
          payment_method: item.payment_method,
          note: item.note ? item.note : `Recurring: ${item.category}`,
          date: currentDueDate.toISOString(),
        });

        if (txError) {
          console.error('Error inserting recurring transaction occurrence:', txError);
          break;
        }

        // 2. Advance next_due_date by frequency interval
        if (item.frequency === 'weekly') {
          currentDueDate.setDate(currentDueDate.getDate() + 7);
        } else if (item.frequency === 'monthly') {
          currentDueDate.setMonth(currentDueDate.getMonth() + 1);
        }
      }

      // Update next_due_date in DB
      await supabase
        .from('recurring_transactions')
        .update({ next_due_date: currentDueDate.toISOString() })
        .eq('id', item.id)
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Error processing recurring transactions on read:', error);
  }
};

module.exports = {
  processRecurringTransactions,
};
