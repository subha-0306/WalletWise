export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', iconName: 'Banknote' },
  { id: 'upi', label: 'UPI', iconName: 'QrCode' },
  { id: 'debit_card', label: 'Debit Card', iconName: 'CreditCard' },
  { id: 'credit_card', label: 'Credit Card', iconName: 'CreditCard' },
  { id: 'bank_transfer', label: 'Bank Transfer', iconName: 'Building2' },
];

export const CATEGORIES = [
  { id: 'Food', label: 'Food', iconName: 'Utensils' },
  { id: 'Transport', label: 'Transport', iconName: 'Car' },
  { id: 'Shopping', label: 'Shopping', iconName: 'ShoppingBag' },
  { id: 'Bills', label: 'Bills', iconName: 'Receipt' },
  { id: 'Entertainment', label: 'Entertainment', iconName: 'Film' },
  { id: 'Education', label: 'Education', iconName: 'GraduationCap' },
  { id: 'Other', label: 'Other', iconName: 'MoreHorizontal' },
];

export const formatCurrency = (amount) => {
  const num = typeof amount === 'number' ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDateGroup = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (targetDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (targetDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
};

export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
