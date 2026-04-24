const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(error.error || 'Request failed', response.status);
  }

  return response.json();
}

const api = {
  sales: {
    getAll: (status?: string) => fetchApi(`/sales${status ? `?status=${status}` : ''}`),
    getById: (id: string) => fetchApi(`/sales/${id}`),
    create: (data: any) => fetchApi('/sales', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi(`/sales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/sales/${id}`, { method: 'DELETE' }),
  },
  products: {
    getAll: () => fetchApi('/products'),
    getById: (id: string) => fetchApi(`/products/${id}`),
    create: (data: any) => fetchApi('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/products/${id}`, { method: 'DELETE' }),
  },
  customers: {
    getAll: () => fetchApi('/customers'),
    getById: (id: string) => fetchApi(`/customers/${id}`),
    create: (data: any) => fetchApi('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/customers/${id}`, { method: 'DELETE' }),
  },
  expenses: {
    getAll: () => fetchApi('/expenses'),
    getById: (id: string) => fetchApi(`/expenses/${id}`),
    create: (data: any) => fetchApi('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/expenses/${id}`, { method: 'DELETE' }),
  },
  dashboard: {
    getStats: () => fetchApi('/dashboard/stats'),
    getRecentSales: () => fetchApi('/dashboard/recent-sales'),
    getLowStock: () => fetchApi('/dashboard/low-stock'),
  },
  notifications: {
    getAll: () => fetchApi('/notifications'),
    markAsRead: (id: string) => fetchApi(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => fetchApi('/notifications/read-all', { method: 'POST' }),
  },
};

export default api;