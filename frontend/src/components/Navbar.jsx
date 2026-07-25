import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Wallet } from 'lucide-react';

export const Navbar = ({ currentView, title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-primary-espresso text-warm-bg shadow-warm pt-safe">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-tertiary-latte/20 flex items-center justify-center border border-tertiary-latte/30">
            <Wallet className="w-4 h-4 text-tertiary-latte" />
          </div>
          <div>
            <h1 className="font-semibold text-base leading-tight text-warm-bg tracking-tight">
              {title || 'WalletWise'}
            </h1>
            {user && (
              <p className="text-[11px] text-tertiary-latte/80 leading-none">
                Hi, {user.name}
              </p>
            )}
          </div>
        </div>

        {user && (
          <button
            onClick={logout}
            title="Log out"
            className="p-2 rounded-lg text-tertiary-latte/80 hover:text-warm-bg hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
