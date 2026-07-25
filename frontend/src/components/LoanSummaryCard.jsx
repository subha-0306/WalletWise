import React from 'react';
import { HandCoins, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

export const LoanSummaryCard = ({ totalLentPending = 0, totalBorrowedPending = 0, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-surface-card rounded-2xl p-4 border border-cream-border shadow-warm-sm flex items-center justify-between hover:shadow-warm transition-all cursor-pointer group"
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-surface-recessed flex items-center justify-center text-primary-espresso group-hover:scale-105 transition-transform">
          <HandCoins className="w-5 h-5 text-secondary-coffee" />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Borrow & Lend Summary
          </span>
          <div className="flex items-center space-x-3 mt-0.5">
            <span className="text-xs font-bold text-indicator-income flex items-center space-x-0.5">
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>You're owed {formatCurrency(totalLentPending)}</span>
            </span>
            <span className="text-xs font-bold text-indicator-expense flex items-center space-x-0.5">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>You owe {formatCurrency(totalBorrowedPending)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
