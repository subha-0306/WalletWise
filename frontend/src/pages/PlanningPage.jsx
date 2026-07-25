import React, { useState, useEffect } from 'react';
import {
  getRecurringApi,
  createRecurringApi,
  patchRecurringApi,
  deleteRecurringApi,
  getBudgetsApi,
  upsertBudgetApi,
  deleteBudgetApi,
  getGoalsApi,
  createGoalApi,
  contributeGoalApi,
  deleteGoalApi,
} from '../services/api';
import { formatCurrency, CATEGORIES, PAYMENT_METHODS } from '../utils/helpers';
import {
  CalendarRange,
  PieChart as PieIcon,
  Target,
  Plus,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Repeat,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  QrCode,
  CreditCard,
  Building2,
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  GraduationCap,
  MoreHorizontal,
} from 'lucide-react';

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

const PRESET_CATEGORIES = ['Rent', 'Netflix', 'Gym Membership', 'Internet Bill', 'EMI'];

export const PlanningPage = ({ onDataUpdated }) => {
  // Top sub-tab: 'recurring' | 'budgets' | 'goals'
  const [activeSubTab, setActiveSubTab] = useState('recurring');

  // State for Recurring
  const [recurringList, setRecurringList] = useState([]);
  const [loadingRecurring, setLoadingRecurring] = useState(true);
  const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false);
  const [recCategory, setRecCategory] = useState('Bills');
  const [recAmount, setRecAmount] = useState('');
  const [recType, setRecType] = useState('expense');
  const [recMethod, setRecMethod] = useState('upi');
  const [recFrequency, setRecFrequency] = useState('monthly');
  const [recDueDate, setRecDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [recNote, setRecNote] = useState('');

  // State for Budgets
  const [budgetsList, setBudgetsList] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [isSetBudgetOpen, setIsSetBudgetOpen] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState('Food');
  const [budgetLimit, setBudgetLimit] = useState('');

  // State for Goals
  const [activeGoals, setActiveGoals] = useState([]);
  const [achievedGoals, setAchievedGoals] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [isAchievedExpanded, setIsAchievedExpanded] = useState(false);

  // Contribute Modal State
  const [contributeGoalId, setContributeGoalId] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeMethod, setContributeMethod] = useState('upi');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load Recurring
  const fetchRecurring = async () => {
    setLoadingRecurring(true);
    try {
      const data = await getRecurringApi();
      setRecurringList(data.recurring || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingRecurring(false);
    }
  };

  // Load Budgets
  const fetchBudgets = async () => {
    setLoadingBudgets(true);
    try {
      const data = await getBudgetsApi();
      setBudgetsList(data.budgets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingBudgets(false);
    }
  };

  // Load Goals
  const fetchGoals = async () => {
    setLoadingGoals(true);
    try {
      const data = await getGoalsApi();
      setActiveGoals(data.active || []);
      setAchievedGoals(data.achieved || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingGoals(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'recurring') fetchRecurring();
    if (activeSubTab === 'budgets') fetchBudgets();
    if (activeSubTab === 'goals') fetchGoals();
  }, [activeSubTab]);

  // Handlers for Recurring
  const handleCreateRecurring = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(recAmount);
    if (!recCategory.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid category and positive amount');
      return;
    }

    setSubmitting(true);
    try {
      await createRecurringApi({
        category: recCategory.trim(),
        amount: parsedAmount,
        paymentMethod: recMethod,
        type: recType,
        frequency: recFrequency,
        nextDueDate: new Date(recDueDate).toISOString(),
        note: recNote.trim() || undefined,
      });

      setIsAddRecurringOpen(false);
      setRecAmount('');
      setRecNote('');
      fetchRecurring();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setError(err.message || 'Failed to create recurring transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRecurring = async (id, currentActive) => {
    try {
      await patchRecurringApi(id, { active: !currentActive });
      fetchRecurring();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteRecurring = async (id) => {
    if (confirm('Delete this recurring series? Past generated transactions will remain in timeline.')) {
      try {
        await deleteRecurringApi(id);
        fetchRecurring();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Handlers for Budgets
  const handleUpsertBudget = async (e) => {
    e.preventDefault();
    const parsedLimit = parseFloat(budgetLimit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setError('Please enter a valid monthly limit amount');
      return;
    }

    setSubmitting(true);
    try {
      await upsertBudgetApi({
        category: budgetCategory,
        monthlyLimit: parsedLimit,
      });

      setIsSetBudgetOpen(false);
      setBudgetLimit('');
      fetchBudgets();
    } catch (err) {
      setError(err.message || 'Failed to set budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (confirm('Remove budget limit for this category?')) {
      try {
        await deleteBudgetApi(id);
        fetchBudgets();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Handlers for Goals
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    const parsedTarget = parseFloat(goalTarget);
    if (!goalName.trim() || isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Please provide a goal name and valid target amount');
      return;
    }

    setSubmitting(true);
    try {
      await createGoalApi({
        name: goalName.trim(),
        targetAmount: parsedTarget,
        targetDate: goalTargetDate ? new Date(goalTargetDate).toISOString() : undefined,
      });

      setIsAddGoalOpen(false);
      setGoalName('');
      setGoalTarget('');
      setGoalTargetDate('');
      fetchGoals();
    } catch (err) {
      setError(err.message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContributeGoal = async (e) => {
    e.preventDefault();
    const parsedContrib = parseFloat(contributeAmount);
    if (!contributeGoalId || isNaN(parsedContrib) || parsedContrib <= 0) {
      alert('Please enter a valid contribution amount');
      return;
    }

    setSubmitting(true);
    try {
      await contributeGoalApi(contributeGoalId, {
        amount: parsedContrib,
        paymentMethod: contributeMethod,
      });

      setContributeGoalId(null);
      setContributeAmount('');
      fetchGoals();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      alert(err.message || 'Failed to record contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (confirm('Delete this goal container? Past contribution transactions will remain in your timeline.')) {
      try {
        await deleteGoalApi(id);
        fetchGoals();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24 space-y-5">
      {/* Top Sub-tabs Switcher */}
      <div className="bg-surface-recessed p-1 rounded-2xl flex">
        <button
          onClick={() => {
            setActiveSubTab('recurring');
            setError(null);
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'recurring'
              ? 'bg-primary-espresso text-warm-bg shadow-warm-sm'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Recurring</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('budgets');
            setError(null);
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'budgets'
              ? 'bg-primary-espresso text-warm-bg shadow-warm-sm'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <PieIcon className="w-3.5 h-3.5" />
          <span>Budgets</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('goals');
            setError(null);
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'goals'
              ? 'bg-primary-espresso text-warm-bg shadow-warm-sm'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Goals</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-indicator-expense/10 text-indicator-expense text-xs font-medium border border-indicator-expense/20">
          {error}
        </div>
      )}

      {/* SUB-TAB 1: RECURRING TRANSACTIONS */}
      {activeSubTab === 'recurring' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Recurring Subscriptions & Income ({recurringList.length})
            </h3>
            <button
              onClick={() => setIsAddRecurringOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-primary-espresso text-warm-bg text-xs font-bold flex items-center space-x-1 hover:bg-secondary-coffee shadow-warm-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Recurring</span>
            </button>
          </div>

          {loadingRecurring ? (
            <div className="space-y-2">
              {[1, 2].map((n) => (
                <div key={n} className="h-16 rounded-xl bg-surface-recessed animate-pulse" />
              ))}
            </div>
          ) : recurringList.length === 0 ? (
            <div className="bg-surface-card rounded-2xl p-6 border border-cream-border text-center space-y-2">
              <p className="text-xs font-semibold text-text-main">No recurring items configured</p>
              <p className="text-[11px] text-text-muted">
                Add subscriptions like Rent, Netflix, or Salary. Due transactions generate automatically on read.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recurringList.map((item) => {
                const Icon = CATEGORY_ICONS[item.category] || MoreHorizontal;
                const isExpense = item.type === 'expense';
                return (
                  <div
                    key={item.id}
                    className={`bg-surface-card rounded-xl p-3.5 border border-cream-border shadow-warm-sm flex items-center justify-between transition-all ${
                      !item.active ? 'opacity-50 bg-surface-recessed/50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div className="w-9 h-9 rounded-xl bg-surface-recessed flex items-center justify-center text-primary-espresso shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-sm text-text-main truncate">
                            {item.category}
                          </span>
                          <span className="text-[10px] font-semibold text-text-muted bg-surface-recessed px-1.5 py-0.5 rounded capitalize">
                            {item.frequency}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted truncate mt-0.5">
                          Next due: {new Date(item.nextDueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="text-right">
                        <span
                          className={`font-bold text-sm block ${
                            isExpense ? 'text-indicator-expense' : 'text-indicator-income'
                          }`}
                        >
                          {isExpense ? '-' : '+'}{formatCurrency(item.amount)}
                        </span>
                      </div>

                      {/* Active Toggle Switch */}
                      <button
                        onClick={() => handleToggleRecurring(item.id, item.active)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                          item.active ? 'bg-indicator-income' : 'bg-cream-border'
                        }`}
                        title={item.active ? 'Active (Click to pause)' : 'Paused (Click to resume)'}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            item.active ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <button
                        onClick={() => handleDeleteRecurring(item.id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-indicator-expense hover:bg-surface-recessed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: BUDGET PLANNER */}
      {activeSubTab === 'budgets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Category Spending Limits ({budgetsList.length})
            </h3>
            <button
              onClick={() => setIsSetBudgetOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-primary-espresso text-warm-bg text-xs font-bold flex items-center space-x-1 hover:bg-secondary-coffee shadow-warm-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Set Budget</span>
            </button>
          </div>

          {loadingBudgets ? (
            <div className="space-y-2">
              {[1, 2].map((n) => (
                <div key={n} className="h-20 rounded-xl bg-surface-recessed animate-pulse" />
              ))}
            </div>
          ) : budgetsList.length === 0 ? (
            <div className="bg-surface-card rounded-2xl p-6 border border-cream-border text-center space-y-2">
              <p className="text-xs font-semibold text-text-main">No category budgets set</p>
              <p className="text-[11px] text-text-muted">
                Set monthly spending limits for Food, Transport, or Shopping to track spending progress bars.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {budgetsList.map((b) => {
                const Icon = CATEGORY_ICONS[b.category] || MoreHorizontal;
                const percentage = b.percentage;

                // Color tier logic:
                // < 80% -> Sage (#7A8B69)
                // 80-100% -> Latte (#D8B48C)
                // > 100% -> Terracotta (#B5674F)
                let barColor = '#7A8B69';
                if (percentage >= 80 && percentage <= 100) barColor = '#D8B48C';
                if (percentage > 100) barColor = '#B5674F';

                return (
                  <div
                    key={b.id}
                    className="bg-surface-card rounded-xl p-4 border border-cream-border shadow-warm-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-surface-recessed flex items-center justify-center text-primary-espresso">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm text-text-main">{b.category}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-text-main">
                          {formatCurrency(b.spentThisMonth)}{' '}
                          <span className="text-text-muted font-normal">/ {formatCurrency(b.monthlyLimit)}</span>
                        </span>
                        <button
                          onClick={() => handleDeleteBudget(b.id)}
                          className="p-1 text-text-muted hover:text-indicator-expense"
                          title="Remove budget limit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-surface-recessed rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(100, percentage)}%`, backgroundColor: barColor }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-semibold text-text-muted">
                      <span>{percentage}% of limit spent</span>
                      {percentage > 100 && (
                        <span className="text-indicator-expense font-bold">
                          Over budget by {formatCurrency(b.spentThisMonth - b.monthlyLimit)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: SAVINGS GOALS */}
      {activeSubTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Active Goals ({activeGoals.length})
            </h3>
            <button
              onClick={() => setIsAddGoalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-primary-espresso text-warm-bg text-xs font-bold flex items-center space-x-1 hover:bg-secondary-coffee shadow-warm-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Goal</span>
            </button>
          </div>

          {loadingGoals ? (
            <div className="space-y-2">
              {[1, 2].map((n) => (
                <div key={n} className="h-24 rounded-xl bg-surface-recessed animate-pulse" />
              ))}
            </div>
          ) : activeGoals.length === 0 ? (
            <div className="bg-surface-card rounded-2xl p-6 border border-cream-border text-center space-y-2">
              <p className="text-xs font-semibold text-text-main">No active savings goals</p>
              <p className="text-[11px] text-text-muted">
                Create a goal like "New Laptop" or "Emergency Fund". Contributions create real wallet transactions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="bg-surface-card rounded-xl p-4 border border-cream-border shadow-warm-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-text-main">{goal.name}</h4>
                      {goal.targetDate && (
                        <p className="text-[10px] text-text-muted mt-0.5">
                          Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1 text-text-muted hover:text-indicator-expense"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-text-main">
                      <span>{formatCurrency(goal.currentAmount)}</span>
                      <span className="text-text-muted font-normal">Target: {formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="w-full bg-surface-recessed rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indicator-income h-full transition-all duration-300 rounded-full"
                        style={{ width: `${goal.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-semibold text-text-muted">
                      <span>{goal.percentage}% saved</span>
                      <span>{formatCurrency(goal.remaining)} remaining</span>
                    </div>
                  </div>

                  {/* Contribute Button */}
                  <button
                    onClick={() => {
                      setContributeGoalId(goal.id);
                      setContributeMethod('upi');
                      setContributeAmount('');
                    }}
                    className="w-full py-2 rounded-xl bg-secondary-coffee hover:bg-primary-espresso text-warm-bg text-xs font-bold flex items-center justify-center space-x-1 transition-colors shadow-warm-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Contribute Money</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Collapsible Achieved Goals Section */}
          {achievedGoals.length > 0 && (
            <div className="pt-2 border-t border-cream-border">
              <button
                onClick={() => setIsAchievedExpanded(!isAchievedExpanded)}
                className="w-full flex items-center justify-between py-2 text-xs font-bold text-text-muted hover:text-text-main"
              >
                <span>Achieved Goals ({achievedGoals.length})</span>
                {isAchievedExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isAchievedExpanded && (
                <div className="space-y-2 mt-2">
                  {achievedGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="bg-surface-card rounded-xl p-3.5 border border-cream-border opacity-75 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle2 className="w-5 h-5 text-indicator-income shrink-0" />
                        <div>
                          <h5 className="font-bold text-xs text-text-main">{goal.name}</h5>
                          <span className="text-[10px] text-text-muted">
                            Achieved {formatCurrency(goal.targetAmount)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1 text-text-muted hover:text-indicator-expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD RECURRING */}
      {isAddRecurringOpen && (
        <div className="fixed inset-0 z-50 bg-primary-espresso/40 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-warm-bg w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl shadow-warm-lg max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="px-5 py-4 bg-surface-card border-b border-cream-border flex items-center justify-between">
              <h2 className="text-base font-bold text-text-main">Add Recurring Item</h2>
              <button
                onClick={() => setIsAddRecurringOpen(false)}
                className="p-1.5 rounded-full text-text-muted hover:text-text-main"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecurring} className="p-5 space-y-4 overflow-y-auto">
              {/* Type Toggle */}
              <div className="bg-surface-recessed p-1 rounded-2xl flex">
                <button
                  type="button"
                  onClick={() => setRecType('expense')}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 transition-all ${
                    recType === 'expense'
                      ? 'bg-indicator-expense text-white shadow-warm-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecType('income')}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 transition-all ${
                    recType === 'income'
                      ? 'bg-indicator-income text-white shadow-warm-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Income</span>
                </button>
              </div>

              {/* Category Input & Preset Chips */}
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  Category
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Rent, Salary"
                  value={recCategory}
                  onChange={(e) => setRecCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-card border border-cream-border rounded-xl text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-text-muted flex items-center mr-1">Presets:</span>
                  {PRESET_CATEGORIES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRecCategory(preset)}
                      className="px-2 py-0.5 rounded-lg bg-surface-card border border-cream-border text-[10px] text-text-main hover:bg-surface-recessed"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={recAmount}
                  onChange={(e) => setRecAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-card border border-cream-border rounded-xl text-lg font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  Frequency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['weekly', 'monthly'].map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setRecFrequency(freq)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                        recFrequency === freq
                          ? 'bg-primary-espresso text-warm-bg border-primary-espresso'
                          : 'bg-surface-card text-text-main border-cream-border'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  Wallet / Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setRecMethod(pm.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        recMethod === pm.id
                          ? 'bg-secondary-coffee text-warm-bg border-secondary-coffee'
                          : 'bg-surface-card text-text-main border-cream-border'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start/Due Date */}
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  First Due Date
                </label>
                <input
                  type="date"
                  required
                  value={recDueDate}
                  onChange={(e) => setRecDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-card border border-cream-border rounded-xl text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-xs font-bold text-warm-bg bg-primary-espresso hover:bg-secondary-coffee flex items-center justify-center space-x-1.5 shadow-warm"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{submitting ? 'Saving...' : 'Save Recurring Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SET BUDGET */}
      {isSetBudgetOpen && (
        <div className="fixed inset-0 z-50 bg-primary-espresso/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-warm-bg w-full max-w-sm rounded-2xl p-5 shadow-warm-lg space-y-4">
            <div className="flex items-center justify-between border-b border-cream-border pb-3">
              <h3 className="text-sm font-bold text-text-main">Set Category Budget</h3>
              <button
                onClick={() => setIsSetBudgetOpen(false)}
                className="p-1 rounded-full text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpsertBudget} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setBudgetCategory(cat.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        budgetCategory === cat.id
                          ? 'bg-primary-espresso text-warm-bg border-primary-espresso'
                          : 'bg-surface-card text-text-main border-cream-border'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  Monthly Limit (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 5000"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-card border border-cream-border rounded-xl text-lg font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSetBudgetOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-cream-border text-xs font-semibold text-text-main hover:bg-surface-recessed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary-espresso text-warm-bg text-xs font-bold hover:bg-secondary-coffee shadow-warm-sm"
                >
                  {submitting ? 'Saving...' : 'Save Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD GOAL */}
      {isAddGoalOpen && (
        <div className="fixed inset-0 z-50 bg-primary-espresso/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-warm-bg w-full max-w-sm rounded-2xl p-5 shadow-warm-lg space-y-4">
            <div className="flex items-center justify-between border-b border-cream-border pb-3">
              <h3 className="text-sm font-bold text-text-main">New Savings Goal</h3>
              <button
                onClick={() => setIsAddGoalOpen(false)}
                className="p-1 rounded-full text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Laptop, Emergency Fund"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-card border border-cream-border rounded-xl text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  Target Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-card border border-cream-border rounded-xl text-lg font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-card border border-cream-border rounded-xl text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddGoalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-cream-border text-xs font-semibold text-text-main hover:bg-surface-recessed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary-espresso text-warm-bg text-xs font-bold hover:bg-secondary-coffee shadow-warm-sm"
                >
                  {submitting ? 'Saving...' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CONTRIBUTE TO GOAL */}
      {contributeGoalId && (
        <div className="fixed inset-0 z-50 bg-primary-espresso/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-warm-bg w-full max-w-sm rounded-2xl p-5 shadow-warm-lg space-y-4">
            <div className="flex items-center justify-between border-b border-cream-border pb-3">
              <h3 className="text-sm font-bold text-text-main">Contribute to Goal</h3>
              <button
                onClick={() => setContributeGoalId(null)}
                className="p-1 rounded-full text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Money contributed will be logged as an expense in your timeline, reducing the selected wallet balance.
            </p>

            <form onSubmit={handleContributeGoal} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  Contribution Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-card border border-cream-border rounded-xl text-lg font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-secondary-coffee"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                  Payment Method / Wallet Used
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setContributeMethod(pm.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        contributeMethod === pm.id
                          ? 'bg-secondary-coffee text-warm-bg border-secondary-coffee'
                          : 'bg-surface-card text-text-main border-cream-border'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContributeGoalId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-cream-border text-xs font-semibold text-text-main hover:bg-surface-recessed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-indicator-income text-white text-xs font-bold hover:opacity-90 shadow-warm-sm"
                >
                  {submitting ? 'Saving...' : 'Confirm Contribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
