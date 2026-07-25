const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let tokenStore = {
  accessToken: null,
};

export const setAccessToken = (token) => {
  tokenStore.accessToken = token;
};

export const getAccessToken = () => {
  return tokenStore.accessToken;
};

// Generic fetch wrapper with auto JWT attachment & silent refresh handling
export const apiFetch = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (tokenStore.accessToken) {
    headers['Authorization'] = `Bearer ${tokenStore.accessToken}`;
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include', // Include httpOnly refresh cookie
  };

  let response = await fetch(url, fetchOptions);

  // If 401 and not an auth endpoint, attempt silent token refresh once
  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAccessToken(refreshData.accessToken);
        
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
        response = await fetch(url, {
          ...fetchOptions,
          headers,
        });
      } else {
        // Refresh failed, clear token
        setAccessToken(null);
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    } catch (err) {
      setAccessToken(null);
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP error! status: ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
};

// Auth API Calls
export const registerApi = (data) =>
  apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const loginApi = (data) =>
  apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const refreshApi = () =>
  apiFetch('/auth/refresh', {
    method: 'POST',
  });

export const logoutApi = () =>
  apiFetch('/auth/logout', {
    method: 'POST',
  });

// Transaction API Calls
export const getTransactionsApi = (page = 1, limit = 50) =>
  apiFetch(`/transactions?page=${page}&limit=${limit}`, {
    method: 'GET',
  });

export const createTransactionApi = (data) =>
  apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateTransactionApi = (id, data) =>
  apiFetch(`/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteTransactionApi = (id) =>
  apiFetch(`/transactions/${id}`, {
    method: 'DELETE',
  });

// Wallet Summary API Call
export const getWalletSummaryApi = () =>
  apiFetch('/wallets/summary', {
    method: 'GET',
  });

// Loans API Calls
export const getLoansApi = (status) =>
  apiFetch(`/loans${status ? `?status=${status}` : ''}`, {
    method: 'GET',
  });

export const createLoanApi = (data) =>
  apiFetch('/loans', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const settleLoanApi = (id, paymentMethod) =>
  apiFetch(`/loans/${id}/settle`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentMethod }),
  });

export const deleteLoanApi = (id) =>
  apiFetch(`/loans/${id}`, {
    method: 'DELETE',
  });

// Reports API Call
export const getReportSummaryApi = (month) =>
  apiFetch(`/reports/summary${month ? `?month=${month}` : ''}`, {
    method: 'GET',
  });

// Recurring API Calls
export const getRecurringApi = () =>
  apiFetch('/recurring', {
    method: 'GET',
  });

export const createRecurringApi = (data) =>
  apiFetch('/recurring', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const patchRecurringApi = (id, data) =>
  apiFetch(`/recurring/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteRecurringApi = (id) =>
  apiFetch(`/recurring/${id}`, {
    method: 'DELETE',
  });

// Budgets API Calls
export const getBudgetsApi = () =>
  apiFetch('/budgets', {
    method: 'GET',
  });

export const upsertBudgetApi = (data) =>
  apiFetch('/budgets', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteBudgetApi = (id) =>
  apiFetch(`/budgets/${id}`, {
    method: 'DELETE',
  });

// Savings Goals API Calls
export const getGoalsApi = () =>
  apiFetch('/goals', {
    method: 'GET',
  });

export const createGoalApi = (data) =>
  apiFetch('/goals', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const contributeGoalApi = (id, data) =>
  apiFetch(`/goals/${id}/contribute`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteGoalApi = (id) =>
  apiFetch(`/goals/${id}`, {
    method: 'DELETE',
  });
