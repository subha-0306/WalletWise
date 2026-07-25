import React from 'react';
import { LayoutDashboard, Plus, History, HandCoins, CalendarRange } from 'lucide-react';

export const BottomNav = ({ activeTab, onTabChange, onOpenAddModal }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-card border-t border-cream-border pb-safe shadow-warm-lg">
      <div className="max-w-md mx-auto px-3 h-16 flex items-center justify-between relative">
        {/* Dashboard Tab */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center space-y-1 w-12 py-1 transition-colors ${
            activeTab === 'dashboard'
              ? 'text-primary-espresso font-semibold'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px]">Dashboard</span>
        </button>

        {/* Loans Tab */}
        <button
          onClick={() => onTabChange('loans')}
          className={`flex flex-col items-center justify-center space-y-1 w-12 py-1 transition-colors ${
            activeTab === 'loans'
              ? 'text-primary-espresso font-semibold'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <HandCoins className="w-5 h-5" />
          <span className="text-[9px]">Loans</span>
        </button>

        {/* Center Floating Action Button (+ Add Transaction) */}
        <div className="relative -top-3">
          <button
            onClick={onOpenAddModal}
            className="w-12 h-12 rounded-full bg-primary-espresso hover:bg-secondary-coffee text-warm-bg shadow-warm-lg flex items-center justify-center transition-all transform active:scale-95 border-2 border-warm-bg"
            aria-label="Add Transaction"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Planning Hub Tab */}
        <button
          onClick={() => onTabChange('planning')}
          className={`flex flex-col items-center justify-center space-y-1 w-12 py-1 transition-colors ${
            activeTab === 'planning'
              ? 'text-primary-espresso font-semibold'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <CalendarRange className="w-5 h-5" />
          <span className="text-[9px]">Planning</span>
        </button>

        {/* Timeline & Reports Tab */}
        <button
          onClick={() => onTabChange('timeline')}
          className={`flex flex-col items-center justify-center space-y-1 w-12 py-1 transition-colors ${
            activeTab === 'timeline'
              ? 'text-primary-espresso font-semibold'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[9px]">Timeline</span>
        </button>
      </div>
    </nav>
  );
};
