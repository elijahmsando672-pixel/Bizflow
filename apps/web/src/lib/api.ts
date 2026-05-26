const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface ApiResponse<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: string;
  businessId?: string;
  business?: {
    id: string;
    name: string;
    type?: string;
    currency?: string;
  };
}

interface AuthResponse {
  user: User;
  token: string;
}

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description?: string;
  category?: string;
  reference?: string;
  date: string;
  customer?: { id: string; name: string };
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  cost?: number;
  stock: number;
  lowStockAlert: number;
  category?: string;
  isActive: boolean;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  whatsappId?: string;
  notes?: string;
  tags: string[];
  _count?: { transactions: number };
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assignedTo?: { id: string; name: string; email: string };
  createdAt: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('bizflow_token', token);
      } else {
        localStorage.removeItem('bizflow_token');
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bizflow_token');
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('bizflow_token');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (data: { email: string; password: string; name?: string; businessName?: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  getProfile: () => api.get<User>('/auth/profile'),
};

export const dashboardApi = {
  getOverview: () => api.get<{
    summary: { revenue: number; expenses: number; profit: number; profitMargin: number };
    counts: { customers: number; lowStockProducts: number; pendingTasks: number };
    recentTransactions: Transaction[];
  }>('/dashboard/overview'),
  getChartData: (days?: number) =>
    api.get<{ date: string; income: number; expense: number }[]>(`/dashboard/chart?days=${days || 30}`),
  getStats: () => api.get<{
    revenue: { current: number; previous: number; change: number };
    expenses: { current: number; previous: number; change: number };
    profit: { current: number; previous: number };
  }>('/dashboard/stats'),
  getActivity: (limit?: number) =>
    api.get<any[]>(`/dashboard/activity?limit=${limit || 20}`),
};

export const financeApi = {
  getTransactions: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<ApiResponse<Transaction[]>>(`/finance/transactions${query}`);
  },

  getTransaction: (id: string) => api.get<Transaction>(`/finance/transactions/${id}`),

  createTransaction: (data: {
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description?: string;
    category?: string;
    date?: string;
    customerId?: string;
  }) => api.post<Transaction>('/finance/transactions', data),

  updateTransaction: (
    id: string,
    data: Partial<{
      type: 'INCOME' | 'EXPENSE';
      amount: number;
      description: string;
      category: string;
    }>
  ) => api.put<Transaction>(`/finance/transactions/${id}`, data),

  deleteTransaction: (id: string) => api.delete<void>(`/finance/transactions/${id}`),

  getSummary: () => api.get<{
    total: { income: number; expense: number; profit: number };
    counts: { income: number; expense: number };
    byCategory: { type: string; category: string; amount: number }[];
  }>('/finance/summary'),
};

export const inventoryApi = {
  getProducts: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<ApiResponse<Product[]>>(`/inventory/products${query}`);
  },

  getLowStock: () => api.get<Product[]>('/inventory/products/low-stock'),

  createProduct: (data: {
    name: string;
    price: number;
    sku?: string;
    cost?: number;
    stock?: number;
    category?: string;
  }) => api.post<Product>('/inventory/products', data),

  updateProduct: (
    id: string,
    data: Partial<{
      name: string;
      price: number;
      stock: number;
    }>
  ) => api.put<Product>(`/inventory/products/${id}`, data),

  deleteProduct: (id: string) => api.delete<void>(`/inventory/products/${id}`),
};

export const customersApi = {
  getCustomers: (params?: { search?: string; page?: number }) => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return api.get<ApiResponse<Customer[]>>(`/customers${query}`);
  },

  getCustomer: (id: string) => api.get<Customer>(`/customers/${id}`),

  createCustomer: (data: { name: string; email?: string; phone?: string }) =>
    api.post<Customer>('/customers', data),

  updateCustomer: (id: string, data: Partial<{ name: string; email: string; phone: string }>) =>
    api.put<Customer>(`/customers/${id}`, data),

  deleteCustomer: (id: string) => api.delete<void>(`/customers/${id}`),
};

export const businessApi = {
  getBusiness: () => api.get<{ id: string; name: string; type?: string; currency?: string }>('/business'),

  updateBusiness: (data: { name?: string; currency?: string; timezone?: string }) =>
    api.put('/business', data),
};

export const tasksApi = {
  getTasks: (params?: { status?: string; assigneeId?: string; page?: string; limit?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return api.get<Task[] | { data: Task[]; pagination: any }>(`/tasks${query}`);
  },

  createTask: (data: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
  }) => api.post<Task>('/tasks', data),

  updateTask: (id: string, data: Partial<{ title: string; status: string }>) =>
    api.put<Task>(`/tasks/${id}`, data),

  updateTaskStatus: (id: string, status: string) =>
    api.put<Task>(`/tasks/${id}/status`, { status }),

  deleteTask: (id: string) => api.delete<void>(`/tasks/${id}`),
};
