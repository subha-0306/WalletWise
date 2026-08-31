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

export const getLocalDateString = (d = new Date()) => {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return getLocalDateString(new Date());
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  if (!dateString) return 'Today';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Today';

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
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
