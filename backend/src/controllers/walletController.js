const defaultSupabase = require('../config/supabase');
const { processRecurringTransactions } = require('../utils/recurringGenerator');

const ALL_PAYMENT_METHODS = [
  'cash',
  'upi',
  'debit_card',
  'credit_card',
  'bank_transfer',
];

const getWalletSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const supabase = req.supabase || defaultSupabase;

    // Auto-process due recurring items on read before computing balances
    await processRecurringTransactions(userId, supabase);

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('payment_method, type, amount')
      .eq('user_id', userId);

    if (error) {
      console.error('Wallet summary fetch error:', error);
      return res.status(500).json({ error: 'Failed to compute wallet summary' });
    }

    const summaryMap = {};
    ALL_PAYMENT_METHODS.forEach((method) => {
      summaryMap[method] = {
        totalIncome: 0,
        totalExpense: 0,
      };
    });

    (transactions || []).forEach((t) => {
      const method = t.payment_method;
      if (!summaryMap[method]) {
        summaryMap[method] = { totalIncome: 0, totalExpense: 0 };
      }
      if (t.type === 'income') {
        summaryMap[method].totalIncome += t.amount;
      } else if (t.type === 'expense') {
        summaryMap[method].totalExpense += t.amount;
      }
    });

    const methodsSummary = {};
    let totalAvailableInCents = 0;

    ALL_PAYMENT_METHODS.forEach((method) => {
      const inc = summaryMap[method].totalIncome;
      const exp = summaryMap[method].totalExpense;
      const balanceInCents = inc - exp;

      methodsSummary[method] = {
        balance: balanceInCents / 100,
        balanceInCents,
        totalIncome: inc / 100,
        totalExpense: exp / 100,
      };
      totalAvailableInCents += balanceInCents;
    });

    return res.status(200).json({
      totalAvailableBalance: totalAvailableInCents / 100,
      totalAvailableBalanceInCents: totalAvailableInCents,
      methods: methodsSummary,
    });
  } catch (error) {
    console.error('Wallet summary aggregation error:', error);
    return res.status(500).json({ error: 'Failed to compute wallet summary' });
  }
};

module.exports = {
  getWalletSummary,
};
