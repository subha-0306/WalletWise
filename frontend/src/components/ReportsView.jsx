import React, { useState, useEffect } from 'react';
import { getReportSummaryApi } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon, BarChart3, RefreshCw } from 'lucide-react';

const CHART_COLORS = ['#4A2E22', '#8B5E3C', '#D8B48C', '#7A8B69', '#B5674F', '#A07855'];

export const ReportsView = ({ refreshKey }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReportSummaryApi();
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to load report summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="bg-surface-card rounded-2xl p-4 border border-cream-border animate-pulse h-64 flex items-center justify-center">
        <span className="text-xs text-text-muted">Loading spending charts...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-surface-card rounded-2xl p-4 border border-cream-border text-center text-xs text-indicator-expense">
        {error || 'Unable to display report data'}
      </div>
    );
  }

  const categoryData = report.categorySpending || [];
  const methodData = (report.paymentMethodSpending || []).map((m) => ({
    ...m,
    formattedMethod: m.paymentMethod.replace('_', ' ').toUpperCase(),
  }));

  return (
    <div className="bg-surface-card rounded-2xl p-4 border border-cream-border shadow-warm-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cream-border pb-3">
        <div>
          <h3 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center space-x-1.5">
            <PieIcon className="w-4 h-4 text-secondary-coffee" />
            <span>Monthly Spending Reports ({report.period?.monthString || 'Current Month'})</span>
          </h3>
        </div>
        <button
          onClick={fetchReports}
          className="p-1 rounded-full text-text-muted hover:text-text-main"
          title="Refresh charts"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chart 1: Spending by Category (Donut Chart) */}
      <div>
        <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
          Spending by Category
        </h4>
        {categoryData.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-6">No expenses logged for this month.</p>
        ) : (
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Amount']}
                  contentStyle={{ backgroundColor: '#FAF6F1', borderColor: '#E8DED2', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        {categoryData.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 justify-center">
            {categoryData.map((item, idx) => (
              <div key={item.category} className="flex items-center space-x-1 text-[11px] text-text-main">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
                <span className="font-semibold">{item.category}:</span>
                <span className="text-text-muted">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chart 2: Spending by Payment Method (Bar Chart) */}
      <div className="pt-4 border-t border-cream-border">
        <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center space-x-1">
          <BarChart3 className="w-3.5 h-3.5 text-secondary-coffee inline" />
          <span>Spending by Payment Method</span>
        </h4>
        {methodData.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-6">No payment method expenses for this month.</p>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={methodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="formattedMethod" tick={{ fontSize: 10, fill: '#7A6A5D' }} />
                <YAxis tick={{ fontSize: 10, fill: '#7A6A5D' }} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Spent']}
                  contentStyle={{ backgroundColor: '#FAF6F1', borderColor: '#E8DED2', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#4A2E22" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
