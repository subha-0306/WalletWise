import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { TimelinePage } from './pages/TimelinePage';
import { LoansPage } from './pages/LoansPage';
import { PlanningPage } from './pages/PlanningPage';
import { AddTransactionPage } from './pages/AddTransactionPage';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Wallet } from 'lucide-react';

const MainApp = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'loans' | 'planning' | 'timeline'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransactionSaved = () => {
    setRefreshKey((prev) => prev + 1);
    setIsAddModalOpen(false);
    setEditingTransaction(null);
  };

  const handleStartEditTransaction = (tx) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingTransaction(null);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'loans':
        return 'Borrow & Lend';
      case 'planning':
        return 'Planning Hub';
      case 'timeline':
        return 'Timeline & Reports';
      default:
        return 'WalletWise';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary-espresso flex items-center justify-center shadow-warm-lg animate-bounce">
          <Wallet className="w-6 h-6 text-tertiary-latte" />
        </div>
        <p className="text-xs font-semibold text-text-muted animate-pulse">
          Loading WalletWise...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-warm-bg text-text-main flex flex-col selection:bg-tertiary-latte">
      <Navbar currentView={activeTab} title={getPageTitle()} />

      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <DashboardPage
            refreshKey={refreshKey}
            onNavigateTimeline={() => setActiveTab('timeline')}
            onNavigateLoans={() => setActiveTab('loans')}
            onOpenAddModal={() => {
              setEditingTransaction(null);
              setIsAddModalOpen(true);
            }}
            onEditTransaction={handleStartEditTransaction}
          />
        )}

        {activeTab === 'loans' && (
          <LoansPage
            onLoanUpdated={() => setRefreshKey((prev) => prev + 1)}
          />
        )}

        {activeTab === 'planning' && (
          <PlanningPage
            onDataUpdated={() => setRefreshKey((prev) => prev + 1)}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelinePage
            refreshKey={refreshKey}
            onItemDeleted={() => setRefreshKey((prev) => prev + 1)}
            onEditTransaction={handleStartEditTransaction}
            onOpenAddModal={() => {
              setEditingTransaction(null);
              setIsAddModalOpen(true);
            }}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsAddModalOpen(true);
        }}
      />

      {isAddModalOpen && (
        <AddTransactionPage
          onClose={handleCloseModal}
          onSuccess={handleTransactionSaved}
          transactionToEdit={editingTransaction}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
