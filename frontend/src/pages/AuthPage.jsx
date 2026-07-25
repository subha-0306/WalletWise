import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react';

export const AuthPage = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Name is required');
        }
        await register(email, password, name);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 pt-safe pb-safe">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Monogram / Brand Header */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-espresso flex items-center justify-center shadow-warm-lg mb-4 border-2 border-tertiary-latte/30">
            <Wallet className="w-8 h-8 text-tertiary-latte" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            WalletWise
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Personal finance in under 10 seconds
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-card py-8 px-6 shadow-warm-lg rounded-2xl border border-cream-border sm:px-10">
          <div className="flex border-b border-cream-border mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors ${
                isLogin
                  ? 'border-primary-espresso text-primary-espresso'
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors ${
                !isLogin
                  ? 'border-primary-espresso text-primary-espresso'
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-indicator-expense/10 border border-indicator-expense/30 text-indicator-expense text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="block w-full pl-10 pr-3 py-2.5 bg-warm-bg border border-cream-border rounded-xl text-sm text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-secondary-coffee focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-warm-bg border border-cream-border rounded-xl text-sm text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-secondary-coffee focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-warm-bg border border-cream-border rounded-xl text-sm text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-secondary-coffee focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold text-warm-bg bg-primary-espresso hover:bg-secondary-coffee shadow-warm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-coffee transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
