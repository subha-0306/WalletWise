import React, { useState } from 'react';
import {
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
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  Link as LinkIcon,
} from 'lucide-react';
import { formatCurrency, formatTime } from '../utils/helpers';

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

export const TransactionItem = ({ transaction, onDelete, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const isIncome = transaction.type === 'income';
  const isLinked = transaction.affectsLinkedRecord || transaction.linkedLoanId || transaction.linkedGoalId;

  const CategoryIcon = CATEGORY_ICONS[transaction.category] || MoreHorizontal;
  const MethodIcon = METHOD_ICONS[transaction.paymentMethod] || Banknote;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (confirm('Delete this transaction?')) {
      setIsDeleting(true);
      try {
        await onDelete(transaction.id);
      } catch (err) {
        alert(err.message || 'Failed to delete transaction');
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(transaction);
    }
  };

  return (
    <div
      onClick={handleEdit}
      className={`bg-surface-card rounded-xl p-3.5 border border-cream-border shadow-warm-sm flex items-center justify-between transition-all hover:border-secondary-coffee/40 cursor-pointer ${
        isDeleting ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      <div className="flex items-center space-x-3 min-w-0 pr-2">
        {/* Category Icon with subtle type tint */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isIncome ? 'bg-indicator-income/15 text-indicator-income' : 'bg-surface-recessed text-primary-espresso'
          }`}
        >
          <CategoryIcon className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="font-semibold text-sm text-text-main truncate">
              {transaction.category}
            </span>
            <span className="text-[10px] text-text-muted bg-surface-recessed px-1.5 py-0.5 rounded flex items-center space-x-1">
              <MethodIcon className="w-3 h-3 inline stroke-[2]" />
              <span className="capitalize">{transaction.paymentMethod.replace('_', ' ')}</span>
            </span>
            {isLinked && (
              <span className="text-[10px] text-secondary-coffee bg-tertiary-latte/20 px-1 py-0.5 rounded flex items-center" title="Linked to Loan or Goal">
                <LinkIcon className="w-3 h-3 stroke-[2.5]" />
              </span>
            )}
          </div>

          {transaction.note ? (
            <p className="text-xs text-text-muted truncate mt-0.5">{transaction.note}</p>
          ) : (
            <p className="text-[11px] text-text-muted/70 mt-0.5">{formatTime(transaction.date)}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <div className="text-right">
          <div
            className={`font-bold text-sm flex items-center justify-end space-x-0.5 ${
              isIncome ? 'text-indicator-income' : 'text-indicator-expense'
            }`}
          >
            {isIncome ? (
              <ArrowDownLeft className="w-3.5 h-3.5 text-indicator-income stroke-[2.5]" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 text-indicator-expense stroke-[2.5]" />
            )}
            <span>
              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            </span>
          </div>
          <p className="text-[10px] text-text-muted text-right">{formatTime(transaction.date)}</p>
        </div>

        {onEdit && (
          <button
            onClick={handleEdit}
            title="Edit transaction"
            className="p-1.5 rounded-lg text-text-muted hover:text-primary-espresso hover:bg-surface-recessed transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}

        {onDelete && (
          <button
            onClick={handleDelete}
            title="Delete transaction"
            className="p-1.5 rounded-lg text-text-muted hover:text-indicator-expense hover:bg-surface-recessed transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
