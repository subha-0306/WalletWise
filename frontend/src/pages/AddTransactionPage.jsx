import React, { useState, useEffect } from 'react';
import { createTransactionApi, updateTransactionApi } from '../services/api';
import { CATEGORIES, PAYMENT_METHODS } from '../utils/helpers';
import {
  X,
  Check,
  Calendar,
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  GraduationCap,
  MoreHorizontal,
  Banknote,
  QrCode,
  CreditCard,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
} from 'lucide-react';

const CATEGORY_ICONS = {
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Bills: Receipt,
  Entertainment: Film,
  Education: GraduationCap,
  Other: MoreHorizontal,
};

const METHOD_ICONS = {
  cash: Banknote,
  upi: QrCode,
  debit_card: CreditCard,
  credit_card: CreditCard,
  bank_transfer: Building2,
};

export const AddTransactionPage = ({ onClose, onSuccess, transactionToEdit = null }) => {
  const isEditMode = !!transactionToEdit;

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLinkedWarning, setShowLinkedWarning] = useState(false);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type || 'expense');
      setAmount(transactionToEdit.amount ? transactionToEdit.amount.toString() : '');
      setCategory(transactionToEdit.category || 'Food');
      setPaymentMethod(transactionToEdit.paymentMethod || 'upi');
      setNote(transactionToEdit.note || '');
      if (transactionToEdit.date) {
        setDate(new Date(transactionToEdit.date).toISOString().split('T')[0]);
      }
    }
  }, [transactionToEdit]);

  const executeSave = async () => {
    const parsedAmount = parseFloat(amount);
    setLoading(true);

    try {
      const payload = {
        type,
        amount: parsedAmount,
        category,
        paymentMethod,
        note: note.trim() || undefined,
        date: date ? new Date(date).toISOString() : undefined,
      };

      if (isEditMode) {
        await updateTransactionApi(transactionToEdit.id, payload);
      } else {
        await createTransactionApi(payload);
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
      setLoading(false);
      setShowLinkedWarning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    // Check if editing a linked record -> show confirmation warning
    const isLinked = transactionToEdit && (transactionToEdit.affectsLinkedRecord || transactionToEdit.linkedLoanId || transactionToEdit.linkedGoalId);
    if (isEditMode && isLinked && !showLinkedWarning) {
      setShowLinkedWarning(true);
      return;
    }

    executeSave();
  };

  const handleQuickAddAmount = (addValue) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addValue).toString());
  };

  return (
    <div className="fixed inset-0 z-50 bg-primary-espresso/40 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
      <div className="bg-warm-bg w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl shadow-warm-lg max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-surface-card border-b border-cream-border flex items-center justify-between">
          <h2 className="text-base font-bold text-text-main flex items-center space-x-2">
            <span>{isEditMode ? 'Edit Transaction' : 'Log Transaction'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-text-muted hover:text-text-main hover:bg-surface-recessed transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-indicator-expense/10 text-indicator-expense text-xs font-medium border border-indicator-expense/20">
              {error}
            </div>
          )}

          {/* Linked Record Confirmation Alert */}
          {showLinkedWarning && (
            <div className="p-3.5 rounded-xl bg-tertiary-latte/20 border border-secondary-coffee/40 text-text-main text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-primary-espresso">
                <AlertTriangle className="w-4 h-4 text-secondary-coffee shrink-0" />
                <span>Linked Transaction Warning</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                This transaction is linked to a Loan or Savings Goal. Editing it may affect tracked balances. Are you sure you want to continue?
              </p>
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLinkedWarning(false)}
                  className="flex-1 py-1.5 rounded-lg border border-cream-border text-[11px] font-semibold hover:bg-surface-card"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeSave}
                  className="flex-1 py-1.5 rounded-lg bg-primary-espresso text-warm-bg text-[11px] font-bold"
                >
                  Confirm Edit
                </button>
              </div>
            </div>
          )}

          {/* Type Toggle: Income vs Expense */}
          <div className="bg-surface-recessed p-1 rounded-2xl flex">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                type === 'expense'
                  ? 'bg-indicator-expense text-white shadow-warm-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                type === 'income'
                  ? 'bg-indicator-income text-white shadow-warm-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Income</span>
            </button>
          </div>

          {/* Large Amount Input */}
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-text-muted">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-surface-card border-2 border-cream-border rounded-2xl text-2xl font-extrabold text-text-main focus:outline-none focus:border-secondary-coffee transition-colors"
              />
            </div>

            {/* Presets */}
            <div className="flex space-x-2 mt-2">
              {[50, 100, 500, 1000, 2000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="flex-1 py-1 rounded-lg bg-surface-card border border-cream-border text-[11px] font-semibold text-text-muted hover:bg-surface-recessed hover:text-text-main transition-colors"
                >
                  +₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.id] || MoreHorizontal;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border ${
                      isSelected
                        ? 'bg-primary-espresso text-warm-bg border-primary-espresso shadow-warm-sm'
                        : 'bg-surface-card text-text-main border-cream-border hover:bg-surface-recessed'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Chips */}
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = METHOD_ICONS[pm.id] || Banknote;
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all border ${
                      isSelected
                        ? 'bg-secondary-coffee text-warm-bg border-secondary-coffee shadow-warm-sm'
                        : 'bg-surface-card text-text-main border-cream-border hover:bg-surface-recessed'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Lunch with team"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-card border border-cream-border rounded-xl text-xs text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
            />
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
              Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-surface-card border border-cream-border rounded-xl text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
              />
            </div>
          </div>

          {/* Instant Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-warm-bg bg-primary-espresso hover:bg-secondary-coffee shadow-warm-lg flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{loading ? 'Saving...' : isEditMode ? 'Update Transaction' : 'Save Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
