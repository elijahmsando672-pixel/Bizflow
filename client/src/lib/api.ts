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

async function fetchApi(endpoint: string, options: FetchOptions = {}): Promise<unknown> {
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

interface RegisterData {
  name: string;
  email: string;
  password: string;
  business_name: string;
  phone?: string;
}

interface CustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}

interface ProductData {
  name: string;
  sku?: string;
  category?: string;
  price: number;
  stock_qty?: number;
  reorder_level?: number;
  description?: string;
}

interface CategoryData {
  name: string;
  description?: string;
}

interface SaleData {
  customer_id?: string;
  items: Array<{ product_id: string; quantity: number; price: number }>;
  total: number;
  status?: string;
}

interface InvoiceData {
  customer_id: string;
  items: Array<{ description: string; quantity: number; price: number }>;
  total: number;
  due_date?: string;
}

interface ExpenseData {
  description: string;
  amount: number;
  category: string;
  expense_date?: string;
  status?: string;
  receipt_url?: string;
}

interface ExpenseCategoryData {
  name: string;
  description?: string;
}

const api = {
  auth: {
    login: (email: string, password: string) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data: RegisterData) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => fetchApi('/auth/me'),
  },
  sales: {
    getAll: (status?: string) => fetchApi(`/sales${status ? `?status=${status}` : ''}`),
    getById: (id: string) => fetchApi(`/sales/${id}`),
    create: (data: SaleData) => fetchApi('/sales', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: SaleData) => fetchApi(`/sales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/sales/${id}`, { method: 'DELETE' }),
  },
  products: {
    getAll: (params?: string) => fetchApi(`/products${params ? `?${params}` : ''}`),
    getById: (id: string) => fetchApi(`/products/${id}`),
    create: (data: ProductData) => fetchApi('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: ProductData) => fetchApi(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/products/${id}`, { method: 'DELETE' }),
    getCategories: () => fetchApi('/products/categories'),
    createCategory: (data: CategoryData) => fetchApi('/products/categories', { method: 'POST', body: JSON.stringify(data) }),
    getStockHistory: (id: string) => fetchApi(`/products/${id}/stock-history`),
  },
  customers: {
    getAll: () => fetchApi('/customers'),
    getById: (id: string) => fetchApi(`/customers/${id}`),
    create: (data: CustomerData) => fetchApi('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: CustomerData) => fetchApi(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/customers/${id}`, { method: 'DELETE' }),
  },
  invoices: {
    getAll: (status?: string) => fetchApi(`/invoices${status ? `?status=${status}` : ''}`),
    getById: (id: string) => fetchApi(`/invoices/${id}`),
    create: (data: InvoiceData) => fetchApi('/invoices', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: InvoiceData) => fetchApi(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/invoices/${id}`, { method: 'DELETE' }),
  },
  expenses: {
    getAll: (params?: string) => fetchApi(`/expenses${params ? `?${params}` : ''}`),
    getById: (id: string) => fetchApi(`/expenses/${id}`),
    create: (data: ExpenseData) => fetchApi('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: ExpenseData) => fetchApi(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/expenses/${id}`, { method: 'DELETE' }),
    getCategories: () => fetchApi('/expenses/categories/list'),
    createCategory: (data: ExpenseCategoryData) => fetchApi('/expenses/categories', { method: 'POST', body: JSON.stringify(data) }),
  },
  dashboard: {
    getStats: () => fetchApi('/dashboard'),
    getRevenueChart: (period?: string) => fetchApi(`/dashboard/revenue-chart${period ? `?period=${period}` : ''}`),
    getExpensesChart: () => fetchApi('/dashboard/expenses-chart'),
    getProfitSummary: () => fetchApi('/dashboard/profit-summary'),
    getRecentSales: () => fetchApi('/dashboard'),
    getLowStock: () => fetchApi('/products?low_stock=true'),
  },
  notifications: {
    getAll: () => fetchApi('/notifications'),
    markAsRead: (id: string) => fetchApi(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => fetchApi('/notifications/read-all', { method: 'POST' }),
  },
};

export default api;