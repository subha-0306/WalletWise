import React, { useState, useEffect } from 'react';
import { getWalletSummaryApi, getTransactionsApi, getLoansApi } from '../services/api';
import { PaymentCard } from '../components/PaymentCard';
import { TransactionItem } from '../components/TransactionItem';
import { LoanSummaryCard } from '../components/LoanSummaryCard';
import { formatCurrency } from '../utils/helpers';
import { Plus, ArrowRight, RefreshCw, Wallet as WalletIcon, AlertCircle } from 'lucide-react';

export const DashboardPage = ({ onNavigateTimeline, onNavigateLoans, onOpenAddModal, onEditTransaction, refreshKey }) => {
  const [summary, setSummary] = useState(null);
  const [loansSummary, setLoansSummary] = useState({ totalLentPending: 0, totalBorrowedPending: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletData, txData, loansData] = await Promise.all([
        getWalletSummaryApi(),
        getTransactionsApi(1, 5),
        getLoansApi('pending'),
      ]);
      setSummary(walletData);
      setRecentTransactions(txData.transactions || []);
      setLoansSummary(loansData.summary || { totalLentPending: 0, totalBorrowedPending: 0 });
    } catch (err) {
      setError(err.message || 'Couldn\'t load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const paymentMethodKeys = ['cash', 'upi', 'debit_card', 'credit_card', 'bank_transfer'];

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24 space-y-5">
      {/* Total Available Balance Banner */}
      <div className="bg-gradient-to-br from-primary-espresso to-secondary-coffee rounded-2xl p-5 text-warm-bg shadow-warm-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-tertiary-latte/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium tracking-wider uppercase text-tertiary-latte/90">
            Total Available Balance
          </span>
          <button
            onClick={fetchData}
            title="Refresh summary"
            className="p-1 rounded-full text-tertiary-latte/70 hover:text-warm-bg hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="text-3xl font-extrabold tracking-tight mb-4 text-warm-bg">
          {summary ? formatCurrency(summary.totalAvailableBalance) : '₹0.00'}
        </div>

        <div className="flex items-center space-x-2 pt-2 border-t border-tertiary-latte/20">
          <button
            onClick={onOpenAddModal}
            className="flex-1 bg-tertiary-latte text-primary-espresso hover:bg-warm-bg font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-warm-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Visible Error State with Retry button */}
      {error && (
        <div className="p-4 rounded-xl bg-indicator-expense/10 text-indicator-expense border border-indicator-expense/20 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1 bg-primary-espresso text-warm-bg rounded-lg text-xs font-bold hover:bg-secondary-coffee transition-colors shadow-warm-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Borrow & Lend Summary Card */}
      <LoanSummaryCard
        totalLentPending={loansSummary.totalLentPending}
        totalBorrowedPending={loansSummary.totalBorrowedPending}
        onClick={onNavigateLoans}
      />

      {/* Payment Method Balance Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Wallets & Payment Methods
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {paymentMethodKeys.map((key) => {
            const methodData = summary?.methods?.[key];
            return (
              <PaymentCard
                key={key}
                methodKey={key}
                balance={methodData ? methodData.balance : 0}
              />
            );
          })}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Recent Activity
          </h2>
          <button
            onClick={onNavigateTimeline}
            className="text-xs font-semibold text-secondary-coffee hover:text-primary-espresso flex items-center space-x-1 transition-colors"
          >
            <span>View Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-16 rounded-xl bg-surface-recessed animate-pulse"
              />
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="bg-surface-card rounded-2xl p-6 border border-cream-border text-center space-y-3 shadow-warm-sm">
            <div className="w-10 h-10 rounded-full bg-surface-recessed flex items-center justify-center mx-auto text-primary-espresso">
              <WalletIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-main">No transactions logged yet</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                Start tracking your money by logging your first income or expense in under 10 seconds.
              </p>
            </div>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-primary-espresso text-warm-bg rounded-xl text-xs font-bold hover:bg-secondary-coffee transition-colors shadow-warm-sm inline-flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Log First Transaction</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onEdit={onEditTransaction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
