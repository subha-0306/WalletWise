import React, { useState, useEffect } from 'react';
import { getLoansApi, createLoanApi, settleLoanApi, deleteLoanApi } from '../services/api';
import { formatCurrency, formatDateGroup, PAYMENT_METHODS } from '../utils/helpers';
import {
  HandCoins,
  Plus,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  X,
  Check,
  Banknote,
  QrCode,
  CreditCard,
  Building2,
} from 'lucide-react';

const METHOD_ICONS = {
  cash: Banknote,
  upi: QrCode,
  debit_card: CreditCard,
  credit_card: CreditCard,
  bank_transfer: Building2,
};

export const LoansPage = ({ onLoanUpdated }) => {
  const [pendingLoans, setPendingLoans] = useState([]);
  const [settledLoans, setSettledLoans] = useState([]);
  const [summary, setSummary] = useState({ totalLentPending: 0, totalBorrowedPending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSettledExpanded, setIsSettledExpanded] = useState(false);

  // Quick-add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('lent'); // 'lent' | 'borrowed'
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Settlement modal state
  const [settleLoanId, setSettleLoanId] = useState(null);
  const [settleMethod, setSettleMethod] = useState('upi');
  const [settling, setSettling] = useState(false);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLoansApi();
      setPendingLoans(data.pending || []);
      setSettledLoans(data.settled || []);
      setSummary(data.summary || { totalLentPending: 0, totalBorrowedPending: 0 });
    } catch (err) {
      setError(err.message || 'Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!personName.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid person name and positive amount');
      return;
    }

    setSubmitting(true);
    try {
      await createLoanApi({
        personName: personName.trim(),
        amount: parsedAmount,
        direction,
        paymentMethod,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        note: note.trim() || undefined,
      });

      setIsAddModalOpen(false);
      setPersonName('');
      setAmount('');
      setNote('');
      setDueDate('');
      fetchLoans();
      if (onLoanUpdated) onLoanUpdated();
    } catch (err) {
      setError(err.message || 'Failed to create loan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSettle = async () => {
    if (!settleLoanId) return;
    setSettling(true);
    try {
      await settleLoanApi(settleLoanId, settleMethod);
      setSettleLoanId(null);
      fetchLoans();
      if (onLoanUpdated) onLoanUpdated();
    } catch (err) {
      alert(err.message || 'Failed to settle loan');
    } finally {
      setSettling(false);
    }
  };

  const handleDeleteLoan = async (id) => {
    if (confirm('Delete this loan? This will also remove the linked transaction from your wallet and timeline.')) {
      try {
        await deleteLoanApi(id);
        fetchLoans();
        if (onLoanUpdated) onLoanUpdated();
      } catch (err) {
        alert(err.message || 'Failed to delete loan');
      }
    }
  };

  const lentPending = pendingLoans.filter((l) => l.direction === 'lent');
  const borrowedPending = pendingLoans.filter((l) => l.direction === 'borrowed');

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24 space-y-6">
      {/* Header & Quick Add */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HandCoins className="w-5 h-5 text-primary-espresso" />
          <h2 className="text-base font-bold text-text-main">Borrow & Lend</h2>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-primary-espresso text-warm-bg text-xs font-bold flex items-center space-x-1 hover:bg-secondary-coffee transition-colors shadow-warm-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Loan</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-indicator-expense/10 text-indicator-expense text-xs font-medium border border-indicator-expense/20">
          {error}
        </div>
      )}

      {/* Overview Totals Card */}
      <div className="bg-surface-card rounded-2xl p-4 border border-cream-border shadow-warm-sm grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
            You Lent (Owed)
          </span>
          <div className="text-lg font-bold text-indicator-income flex items-center space-x-1">
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{formatCurrency(summary.totalLentPending)}</span>
          </div>
        </div>

        <div className="space-y-1 border-l border-cream-border pl-4">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
            You Borrowed (Owe)
          </span>
          <div className="text-lg font-bold text-indicator-expense flex items-center space-x-1">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>{formatCurrency(summary.totalBorrowedPending)}</span>
          </div>
        </div>
      </div>

      {/* PENDING LOANS SECTION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Pending Loans ({pendingLoans.length})
        </h3>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((n) => (
              <div key={n} className="h-20 rounded-xl bg-surface-recessed animate-pulse" />
            ))}
          </div>
        ) : pendingLoans.length === 0 ? (
          <div className="bg-surface-card rounded-2xl p-6 border border-cream-border text-center space-y-2">
            <p className="text-xs font-semibold text-text-main">No pending loans</p>
            <p className="text-[11px] text-text-muted">
              Tap "New Loan" above to record money lent to or borrowed from friends.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* LENT GROUP */}
            {lentPending.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-indicator-income uppercase tracking-wider flex items-center space-x-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Money You Lent ({lentPending.length})</span>
                </div>
                {lentPending.map((loan) => (
                  <LoanItem
                    key={loan.id}
                    loan={loan}
                    onSettle={() => {
                      setSettleLoanId(loan.id);
                      setSettleMethod('upi');
                    }}
                    onDelete={() => handleDeleteLoan(loan.id)}
                  />
                ))}
              </div>
            )}

            {/* BORROWED GROUP */}
            {borrowedPending.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-indicator-expense uppercase tracking-wider flex items-center space-x-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Money You Borrowed ({borrowedPending.length})</span>
                </div>
                {borrowedPending.map((loan) => (
                  <LoanItem
                    key={loan.id}
                    loan={loan}
                    onSettle={() => {
                      setSettleLoanId(loan.id);
                      setSettleMethod('upi');
                    }}
                    onDelete={() => handleDeleteLoan(loan.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SETTLED LOANS SECTION (Collapsible) */}
      {settledLoans.length > 0 && (
        <div className="pt-2 border-t border-cream-border">
          <button
            onClick={() => setIsSettledExpanded(!isSettledExpanded)}
            className="w-full flex items-center justify-between py-2 text-xs font-bold text-text-muted hover:text-text-main transition-colors"
          >
            <span>Settled History ({settledLoans.length})</span>
            {isSettledExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isSettledExpanded && (
            <div className="space-y-2 mt-2">
              {settledLoans.map((loan) => (
                <LoanItem
                  key={loan.id}
                  loan={loan}
                  onDelete={() => handleDeleteLoan(loan.id)}
                  isSettled
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUICK ADD LOAN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary-espresso/40 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-warm-bg w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl shadow-warm-lg max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="px-5 py-4 bg-surface-card border-b border-cream-border flex items-center justify-between">
              <h2 className="text-base font-bold text-text-main">New Loan Record</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full text-text-muted hover:text-text-main hover:bg-surface-recessed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="p-5 space-y-4 overflow-y-auto">
              {/* Direction Toggle */}
              <div className="bg-surface-recessed p-1 rounded-2xl flex">
                <button
                  type="button"
                  onClick={() => setDirection('lent')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                    direction === 'lent'
                      ? 'bg-indicator-income text-white shadow-warm-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>I Lent Money</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('borrowed')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                    direction === 'borrowed'
                      ? 'bg-indicator-expense text-white shadow-warm-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>I Borrowed Money</span>
                </button>
              </div>

              {/* Person Name */}
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  Person Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-card border border-cream-border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-card border border-cream-border rounded-xl text-xl font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                  Wallet / Payment Method Affected
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((pm) => {
                    const Icon = METHOD_ICONS[pm.id] || Banknote;
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all border ${
                          isSelected
                            ? 'bg-secondary-coffee text-warm-bg border-secondary-coffee'
                            : 'bg-surface-card text-text-main border-cream-border hover:bg-surface-recessed'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="truncate">{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Due Date */}
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-card border border-cream-border rounded-xl text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
                />
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Reason / details"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-card border border-cream-border rounded-xl text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-xs font-bold text-warm-bg bg-primary-espresso hover:bg-secondary-coffee flex items-center justify-center space-x-1.5 shadow-warm transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{submitting ? 'Saving...' : 'Save Loan Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTLE LOAN MODAL */}
      {settleLoanId && (
        <div className="fixed inset-0 z-50 bg-primary-espresso/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-warm-bg w-full max-w-sm rounded-2xl p-5 shadow-warm-lg space-y-4">
            <div className="flex items-center justify-between border-b border-cream-border pb-3">
              <h3 className="text-sm font-bold text-text-main">Mark Loan as Settled</h3>
              <button
                onClick={() => setSettleLoanId(null)}
                className="p-1 rounded-full text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Select the wallet receiving/paying the settled amount. A reverse transaction will automatically be logged in your wallet balance.
            </p>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider">
                Settlement Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSettleMethod(pm.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      settleMethod === pm.id
                        ? 'bg-primary-espresso text-warm-bg border-primary-espresso'
                        : 'bg-surface-card text-text-main border-cream-border'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSettleLoanId(null)}
                className="flex-1 py-2.5 rounded-xl border border-cream-border text-xs font-semibold text-text-main hover:bg-surface-recessed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSettle}
                disabled={settling}
                className="flex-1 py-2.5 rounded-xl bg-indicator-income text-white text-xs font-bold hover:opacity-90 shadow-warm-sm"
              >
                {settling ? 'Settling...' : 'Confirm Settle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Single Loan Card Component
const LoanItem = ({ loan, onSettle, onDelete, isSettled }) => {
  const isLent = loan.direction === 'lent';

  return (
    <div
      className={`bg-surface-card rounded-xl p-3.5 border border-cream-border shadow-warm-sm flex items-center justify-between transition-all ${
        isSettled ? 'opacity-70 bg-surface-recessed/50' : ''
      }`}
    >
      <div className="flex items-center space-x-3 min-w-0 pr-2">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isLent ? 'bg-indicator-income/15 text-indicator-income' : 'bg-indicator-expense/15 text-indicator-expense'
          }`}
        >
          {isLent ? <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" /> : <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />}
        </div>

        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-sm text-text-main truncate">{loan.personName}</span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${
                isLent ? 'bg-indicator-income/10 text-indicator-income' : 'bg-indicator-expense/10 text-indicator-expense'
              }`}
            >
              {isLent ? 'Lent' : 'Borrowed'}
            </span>
          </div>

          <p className="text-[11px] text-text-muted truncate mt-0.5">
            {loan.note || (isLent ? `Owed by ${loan.personName}` : `Owed to ${loan.personName}`)}
          </p>

          {loan.dueDate && !isSettled && (
            <p className="text-[10px] font-medium text-secondary-coffee flex items-center space-x-1 mt-0.5">
              <Calendar className="w-3 h-3 inline" />
              <span>Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <div className="text-right">
          <div
            className={`font-extrabold text-sm ${
              isLent ? 'text-indicator-income' : 'text-indicator-expense'
            }`}
          >
            {formatCurrency(loan.amount)}
          </div>
          {isSettled && (
            <span className="text-[10px] font-semibold text-indicator-income flex items-center justify-end space-x-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>Settled</span>
            </span>
          )}
        </div>

        {!isSettled && onSettle && (
          <button
            onClick={onSettle}
            title="Mark Settled"
            className="px-2.5 py-1.5 rounded-lg bg-indicator-income text-white text-xs font-bold hover:opacity-90 shadow-warm-sm transition-all"
          >
            Settle
          </button>
        )}

        <button
          onClick={onDelete}
          title="Delete Loan"
          className="p-1.5 rounded-lg text-text-muted hover:text-indicator-expense hover:bg-surface-recessed transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
