import React from 'react';
import { Banknote, QrCode, CreditCard, Building2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const METHOD_CONFIG = {
  cash: { label: 'Cash', icon: Banknote },
  upi: { label: 'UPI', icon: QrCode },
  debit_card: { label: 'Debit Card', icon: CreditCard },
  credit_card: { label: 'Credit Card', icon: CreditCard },
  bank_transfer: { label: 'Bank Transfer', icon: Building2 },
};

export const PaymentCard = ({ methodKey, balance }) => {
  const config = METHOD_CONFIG[methodKey] || { label: methodKey, icon: Banknote };
  const IconComponent = config.icon;
  const isNegative = balance < 0;

  return (
    <div className="bg-surface-card rounded-xl p-3.5 border border-cream-border shadow-warm-sm flex flex-col justify-between hover:shadow-warm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-surface-recessed flex items-center justify-center text-primary-espresso">
          <IconComponent className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-medium tracking-wide uppercase text-text-muted bg-surface-recessed px-2 py-0.5 rounded-full">
          {config.label}
        </span>
      </div>
      <div>
        <div
          className={`text-base font-bold tracking-tight ${
            isNegative ? 'text-indicator-expense' : 'text-text-main'
          }`}
        >
          {formatCurrency(balance)}
        </div>
      </div>
    </div>
  );
};
