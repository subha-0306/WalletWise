const defaultSupabase = require('../config/supabase');

const getReportSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const supabase = req.supabase || defaultSupabase;
    const { month } = req.query; // YYYY-MM format

    let startDateObj, endDateObj;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split('-').map(Number);
      startDateObj = new Date(year, m - 1, 1);
      endDateObj = new Date(year, m, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDateObj = new Date(now.getFullYear(), now.getMonth(), 1);
      endDateObj = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const startDateIso = startDateObj.toISOString();
    const endDateIso = endDateObj.toISOString();

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, category, payment_method, amount')
      .eq('user_id', userId)
      .gte('date', startDateIso)
      .lte('date', endDateIso);

    if (error) {
      console.error('Report summary fetch error:', error);
      return res.status(500).json({ error: 'Failed to compute report summary' });
    }

    const categoryMap = {};
    const paymentMethodMap = {};
    let monthIncomeCents = 0;
    let monthExpenseCents = 0;

    (transactions || []).forEach((t) => {
      if (t.type === 'income') {
        monthIncomeCents += t.amount;
      } else if (t.type === 'expense') {
        monthExpenseCents += t.amount;

        if (!categoryMap[t.category]) {
          categoryMap[t.category] = { totalCents: 0, count: 0 };
        }
        categoryMap[t.category].totalCents += t.amount;
        categoryMap[t.category].count += 1;

        const pm = t.payment_method;
        if (!paymentMethodMap[pm]) {
          paymentMethodMap[pm] = { totalCents: 0, count: 0 };
        }
        paymentMethodMap[pm].totalCents += t.amount;
        paymentMethodMap[pm].count += 1;
      }
    });

    const categorySpending = Object.keys(categoryMap)
      .map((cat) => ({
        category: cat,
        amount: categoryMap[cat].totalCents / 100,
        count: categoryMap[cat].count,
      }))
      .sort((a, b) => b.amount - a.amount);

    const paymentMethodSpending = Object.keys(paymentMethodMap)
      .map((pm) => ({
        paymentMethod: pm,
        amount: paymentMethodMap[pm].totalCents / 100,
        count: paymentMethodMap[pm].count,
      }))
      .sort((a, b) => b.amount - a.amount);

    return res.status(200).json({
      period: {
        startDate: startDateObj,
        endDate: endDateObj,
        monthString: `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}`,
      },
      totals: {
        income: monthIncomeCents / 100,
        expense: monthExpenseCents / 100,
        net: (monthIncomeCents - monthExpenseCents) / 100,
      },
      categorySpending,
      paymentMethodSpending,
    });
  } catch (error) {
    console.error('Report summary error:', error);
    return res.status(500).json({ error: 'Failed to compute report summary' });
  }
};

module.exports = {
  getReportSummary,
};
