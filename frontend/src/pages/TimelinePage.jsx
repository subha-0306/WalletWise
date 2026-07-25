import React, { useState, useEffect, useMemo } from 'react';
import { getTransactionsApi, deleteTransactionApi } from '../services/api';
import { TransactionItem } from '../components/TransactionItem';
import { ReportsView } from '../components/ReportsView';
import { formatDateGroup, PAYMENT_METHODS } from '../utils/helpers';
import { History, Search, X, PieChart, SlidersHorizontal, AlertCircle, Plus } from 'lucide-react';

export const TimelinePage = ({ refreshKey, onItemDeleted, onEditTransaction, onOpenAddModal }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View state: 'timeline' or 'reports'
  const [activeSubTab, setActiveSubTab] = useState('timeline');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getTransactionsApi(1, 100);
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err.message || 'Couldn\'t load your transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [refreshKey]);

  const handleDelete = async (id) => {
    await deleteTransactionApi(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (onItemDeleted) {
      onItemDeleted();
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase().trim();
        const matchesCategory = tx.category.toLowerCase().includes(query);
        const matchesNote = (tx.note || '').toLowerCase().includes(query);
        const matchesMethod = (tx.paymentMethod || '').toLowerCase().includes(query);
        if (!matchesCategory && !matchesNote && !matchesMethod) {
          return false;
        }
      }

      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }

      if (selectedMethod !== 'all' && tx.paymentMethod !== selectedMethod) {
        return false;
      }

      if (selectedDateRange !== 'all') {
        const txDate = new Date(tx.date);
        const now = new Date();

        if (selectedDateRange === 'this_week') {
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          startOfWeek.setHours(0, 0, 0, 0);
          if (txDate < startOfWeek) return false;
        } else if (selectedDateRange === 'this_month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          if (txDate < startOfMonth) return false;
        }
      }

      return true;
    });
  }, [transactions, debouncedSearch, selectedType, selectedMethod, selectedDateRange]);

  const isFilterActive =
    debouncedSearch.trim() !== '' ||
    selectedType !== 'all' ||
    selectedMethod !== 'all' ||
    selectedDateRange !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedType('all');
    setSelectedMethod('all');
    setSelectedDateRange('all');
  };

  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
      const groupKey = formatDateGroup(tx.date);
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(tx);
      return acc;
    }, {});
  }, [filteredTransactions]);

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24 space-y-4">
      {/* View Switcher */}
      <div className="bg-surface-recessed p-1 rounded-xl flex">
        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'timeline'
              ? 'bg-primary-espresso text-warm-bg shadow-warm-sm'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Timeline ({filteredTransactions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'reports'
              ? 'bg-primary-espresso text-warm-bg shadow-warm-sm'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Reports</span>
        </button>
      </div>

      {activeSubTab === 'reports' ? (
        <ReportsView refreshKey={refreshKey} />
      ) : (
        <>
          {/* SEARCH & FILTERS */}
          <div className="bg-surface-card rounded-2xl p-3.5 border border-cream-border shadow-warm-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search note, category, person..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-warm-bg border border-cream-border rounded-xl text-xs text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-2 pt-1 border-t border-cream-border">
              <div className="flex items-center justify-between text-[11px] font-bold text-text-muted">
                <span className="flex items-center space-x-1">
                  <SlidersHorizontal className="w-3 h-3 text-secondary-coffee" />
                  <span>Filters</span>
                </span>
                {isFilterActive && (
                  <button
                    onClick={handleClearFilters}
                    className="text-indicator-expense hover:underline font-bold text-[10px]"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Type Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All Types' },
                  { id: 'income', label: 'Income' },
                  { id: 'expense', label: 'Expense' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedType(t.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      selectedType === t.id
                        ? 'bg-secondary-coffee text-warm-bg border-secondary-coffee'
                        : 'bg-surface-recessed text-text-main border-transparent hover:bg-cream-border'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Payment Method Chips */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedMethod('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    selectedMethod === 'all'
                      ? 'bg-secondary-coffee text-warm-bg border-secondary-coffee'
                      : 'bg-surface-recessed text-text-main border-transparent hover:bg-cream-border'
                  }`}
                >
                  All Wallets
                </button>
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setSelectedMethod(pm.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      selectedMethod === pm.id
                        ? 'bg-secondary-coffee text-warm-bg border-secondary-coffee'
                        : 'bg-surface-recessed text-text-main border-transparent hover:bg-cream-border'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>

              {/* Date Range Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'this_week', label: 'This Week' },
                  { id: 'this_month', label: 'This Month' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDateRange(d.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      selectedDateRange === d.id
                        ? 'bg-primary-espresso text-warm-bg border-primary-espresso'
                        : 'bg-surface-recessed text-text-main border-transparent hover:bg-cream-border'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visible Error State with Retry Button */}
          {error && (
            <div className="p-4 rounded-xl bg-indicator-expense/10 text-indicator-expense border border-indicator-expense/20 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchTransactions}
                className="px-3 py-1 bg-primary-espresso text-warm-bg rounded-lg text-xs font-bold hover:bg-secondary-coffee transition-colors shadow-warm-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* TIMELINE LIST & EMPTY STATE */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 rounded-xl bg-surface-recessed animate-pulse" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="bg-surface-card rounded-2xl p-8 border border-cream-border text-center space-y-3 shadow-warm-sm">
              <p className="text-sm font-bold text-text-main">
                {isFilterActive ? 'No matching transactions found' : 'No transactions logged yet'}
              </p>
              <p className="text-xs text-text-muted">
                {isFilterActive
                  ? 'Try adjusting your search terms or clearing active filters.'
                  : 'Start tracking your spending and income in real time.'}
              </p>
              {isFilterActive ? (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-primary-espresso text-warm-bg rounded-xl text-xs font-bold"
                >
                  Clear All Filters
                </button>
              ) : (
                <button
                  onClick={onOpenAddModal}
                  className="px-4 py-2 bg-primary-espresso text-warm-bg rounded-xl text-xs font-bold inline-flex items-center space-x-1 shadow-warm-sm"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Log First Transaction</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedTransactions).map(([dateGroup, items]) => (
                <div key={dateGroup} className="space-y-2">
                  <div className="sticky top-14 z-20 bg-warm-bg/95 backdrop-blur-sm py-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted bg-surface-recessed px-2.5 py-1 rounded-md inline-block">
                      {dateGroup}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {items.map((tx) => (
                      <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        onDelete={handleDelete}
                        onEdit={onEditTransaction}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
