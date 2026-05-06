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
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const isStateChanging = !['GET', 'HEAD'].includes(options.method || 'GET');
  if (isStateChanging) {
    const csrfToken = typeof document !== 'undefined' 
      ? document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1]
      : null;
    if (csrfToken) {
      headers['X-Csrf-Token'] = csrfToken;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 403 && isStateChanging) {
    try {
      const csrfResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/csrf-token`,
        { method: 'GET', credentials: 'include' }
      );
      if (csrfResponse.ok) {
        const { csrfToken } = await csrfResponse.json();
        headers['X-Csrf-Token'] = csrfToken;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        });
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({ error: 'Request failed' }));
          throw new ApiError(error.error || 'Request failed', retryResponse.status);
        }
        return retryResponse.json();
      }
    } catch {
      // CSRF recovery failed, fall through to normal error handling
    }
  }

  if (response.status === 401) {
    try {
      const refreshResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      
      if (refreshResponse.ok) {
        const { token: newToken } = await refreshResponse.json();
        localStorage.setItem('token', newToken);
        
        const newHeaders = {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        };
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: newHeaders,
          credentials: 'include',
        });
        
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({ error: 'Request failed' }));
          throw new ApiError(error.error || 'Request failed', retryResponse.status);
        }
        
        return retryResponse.json();
      }
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('business');
        window.location.href = '/login';
      }
      throw new ApiError('Session expired', 401);
    }
  }

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
    getReceipt: (saleId: string) => fetchApi(`/sales/${saleId}/receipt`),
    getReceiptHtml: (saleId: string) => fetchApi(`/sales/${saleId}/receipt/html`),
    getAllReceipts: () => fetchApi('/sales/receipts'),
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
    update: (id: string, data: Partial<ExpenseData>) => fetchApi(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
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
    getLowStockDetails: () => fetchApi('/dashboard/low-stock'),
    getTopProducts: (period?: string) => fetchApi(`/dashboard/top-products${period ? `?period=${period}` : ''}`),
    getFrequentCustomers: (period?: string) => fetchApi(`/dashboard/frequent-customers${period ? `?period=${period}` : ''}`),
    getRestockBudget: (multiplier?: number) => fetchApi(`/dashboard/restock-budget${multiplier ? `?multiplier=${multiplier}` : ''}`),
    createRestockBudget: (data: unknown) => fetchApi('/dashboard/restock-budget', { method: 'POST', body: JSON.stringify(data) }),
  },
  notifications: {
    getAll: () => fetchApi('/notifications'),
    markAsRead: (id: string) => fetchApi(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => fetchApi('/notifications/read-all', { method: 'POST' }),
  },
  team: {
    getMembers: () => fetchApi('/team/members'),
    invite: (data: { email: string; role: string }) => fetchApi('/team/invite', { method: 'POST', body: JSON.stringify(data) }),
    accept: (data: { token: string; name: string; password: string }) => fetchApi('/team/accept', { method: 'POST', body: JSON.stringify(data) }),
    getInvitations: () => fetchApi('/team/invitations'),
    revokeInvite: (id: string) => fetchApi(`/team/invitations/${id}`, { method: 'DELETE' }),
    updateRole: (id: string, role: string) => fetchApi(`/team/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
    updateMember: (id: string, data: { is_active: boolean }) => fetchApi(`/team/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  employees: {
    getAll: (params?: string) => fetchApi(`/employees${params ? `?${params}` : ''}`),
    getById: (id: string) => fetchApi(`/employees/${id}`),
    create: (data: unknown) => fetchApi('/employees', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => fetchApi(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/employees/${id}`, { method: 'DELETE' }),
    clockIn: (id: string) => fetchApi(`/employees/${id}/clock-in`, { method: 'POST' }),
    clockOut: (id: string) => fetchApi(`/employees/${id}/clock-out`, { method: 'POST' }),
    getAttendance: (params?: string) => fetchApi(`/employees/attendance${params ? `?${params}` : ''}`),
    getPayroll: (params?: string) => fetchApi(`/employees/payroll${params ? `?${params}` : ''}`),
    createPayroll: (data: unknown) => fetchApi('/employees/payroll', { method: 'POST', body: JSON.stringify(data) }),
    updatePayroll: (id: string, data: unknown) => fetchApi(`/employees/payroll/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  subscriptions: {
    getPlans: () => fetchApi('/subscriptions/plans'),
    getCurrent: () => fetchApi('/subscriptions/current'),
    activate: (planId: string) => fetchApi('/subscriptions/activate', { method: 'POST', body: JSON.stringify({ plan_id: planId }) }),
    cancel: () => fetchApi('/subscriptions/cancel', { method: 'POST' }),
    getPayments: () => fetchApi('/subscriptions/payments'),
    recordPayment: (data: unknown) => fetchApi('/subscriptions/payments/record', { method: 'POST', body: JSON.stringify(data) }),
  },
  debtors: {
    getAll: (params?: string) => fetchApi(`/debtors${params ? `?${params}` : ''}`),
    create: (data: unknown) => fetchApi('/debtors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => fetchApi(`/debtors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/debtors/${id}`, { method: 'DELETE' }),
    getSummary: () => fetchApi('/debtors/summary'),
    getInvoices: (id: string) => fetchApi(`/debtors/${id}/invoices`),
    createInvoice: (id: string, data: unknown) => fetchApi(`/debtors/${id}/invoices`, { method: 'POST', body: JSON.stringify(data) }),
    recordPayment: (id: string, data: unknown) => fetchApi(`/debtors/${id}/payments`, { method: 'POST', body: JSON.stringify(data) }),
    markInvoicePaid: (invoiceId: string) => fetchApi(`/debtors/invoices/${invoiceId}/pay`, { method: 'PUT' }),
  },
  reports: {
    getProfitLoss: (params?: string) => fetchApi(`/reports/profit-loss${params ? `?${params}` : ''}`),
    getSalesReport: (params?: string) => fetchApi(`/reports/sales-report${params ? `?${params}` : ''}`),
    getInventoryReport: () => fetchApi('/reports/inventory-report'),
    getCashflowReport: (params?: string) => fetchApi(`/reports/cashflow-report${params ? `?${params}` : ''}`),
    getTaxSummary: (year?: string) => fetchApi(`/reports/tax-summary${year ? `?year=${year}` : ''}`),
  },
  ai: {
    getInsights: () => fetchApi('/ai/insights'),
    getPredictions: () => fetchApi('/ai/predictions'),
    getHistory: () => fetchApi('/ai/history'),
  },
  crm: {
    getLeads: (params?: string) => fetchApi(`/crm${params ? `?${params}` : ''}`),
    getLead: (id: string) => fetchApi(`/crm/${id}`),
    createLead: (data: unknown) => fetchApi('/crm', { method: 'POST', body: JSON.stringify(data) }),
    updateLead: (id: string, data: unknown) => fetchApi(`/crm/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    convertLead: (id: string, data: unknown) => fetchApi(`/crm/${id}/convert`, { method: 'POST', body: JSON.stringify(data) }),
    addActivity: (id: string, data: unknown) => fetchApi(`/crm/${id}/activities`, { method: 'POST', body: JSON.stringify(data) }),
    deleteLead: (id: string) => fetchApi(`/crm/${id}`, { method: 'DELETE' }),
  },
  pipeline: {
    getStages: () => fetchApi('/pipeline/stages'),
    createStage: (data: unknown) => fetchApi('/pipeline/stages', { method: 'POST', body: JSON.stringify(data) }),
    updateStage: (id: string, data: unknown) => fetchApi(`/pipeline/stages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteStage: (id: string) => fetchApi(`/pipeline/stages/${id}`, { method: 'DELETE' }),
    getDeals: (params?: string) => fetchApi(`/pipeline${params ? `?${params}` : ''}`),
    getDeal: (id: string) => fetchApi(`/pipeline/${id}`),
    createDeal: (data: unknown) => fetchApi('/pipeline', { method: 'POST', body: JSON.stringify(data) }),
    updateDeal: (id: string, data: unknown) => fetchApi(`/pipeline/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    addDealActivity: (id: string, data: unknown) => fetchApi(`/pipeline/${id}/activities`, { method: 'POST', body: JSON.stringify(data) }),
    deleteDeal: (id: string) => fetchApi(`/pipeline/${id}`, { method: 'DELETE' }),
    getSummary: () => fetchApi('/pipeline/pipeline-summary'),
  },
  support: {
    getTickets: (params?: string) => fetchApi(`/support${params ? `?${params}` : ''}`),
    getTicket: (id: string) => fetchApi(`/support/${id}`),
    createTicket: (data: unknown) => fetchApi('/support', { method: 'POST', body: JSON.stringify(data) }),
    updateTicket: (id: string, data: unknown) => fetchApi(`/support/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTicket: (id: string) => fetchApi(`/support/${id}`, { method: 'DELETE' }),
    getReplies: (id: string) => fetchApi(`/support/${id}/replies`),
    addReply: (id: string, data: unknown) => fetchApi(`/support/${id}/replies`, { method: 'POST', body: JSON.stringify(data) }),
    getSlaConfigs: () => fetchApi('/support/sla-configs'),
    updateSlaConfig: (id: string, data: unknown) => fetchApi(`/support/sla-configs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getStats: () => fetchApi('/support/dashboard-stats'),
  },
  projects: {
    getProjects: (params?: string) => fetchApi(`/projects${params ? `?${params}` : ''}`),
    getProject: (id: string) => fetchApi(`/projects/${id}`),
    createProject: (data: unknown) => fetchApi('/projects', { method: 'POST', body: JSON.stringify(data) }),
    updateProject: (id: string, data: unknown) => fetchApi(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProject: (id: string) => fetchApi(`/projects/${id}`, { method: 'DELETE' }),
    getTasks: (projectId: string) => fetchApi(`/projects/${projectId}/tasks`),
    createTask: (projectId: string, data: unknown) => fetchApi(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
    updateTask: (taskId: string, data: unknown) => fetchApi(`/projects/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  procurement: {
    getVendors: () => fetchApi('/procurement/vendors'),
    getVendor: (id: string) => fetchApi(`/procurement/vendors/${id}`),
    createVendor: (data: unknown) => fetchApi('/procurement/vendors', { method: 'POST', body: JSON.stringify(data) }),
    updateVendor: (id: string, data: unknown) => fetchApi(`/procurement/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteVendor: (id: string) => fetchApi(`/procurement/vendors/${id}`, { method: 'DELETE' }),
    getPurchaseOrders: (params?: string) => fetchApi(`/procurement/purchase-orders${params ? `?${params}` : ''}`),
    getPurchaseOrder: (id: string) => fetchApi(`/procurement/purchase-orders/${id}`),
    createPurchaseOrder: (data: unknown) => fetchApi('/procurement/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    updatePurchaseOrder: (id: string, data: unknown) => fetchApi(`/procurement/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePurchaseOrder: (id: string) => fetchApi(`/procurement/purchase-orders/${id}`, { method: 'DELETE' }),
  },
  timetracking: {
    getEntries: (params?: string) => fetchApi(`/timetracking${params ? `?${params}` : ''}`),
    getSummary: (params?: string) => fetchApi(`/timetracking/summary${params ? `?${params}` : ''}`),
    createEntry: (data: unknown) => fetchApi('/timetracking', { method: 'POST', body: JSON.stringify(data) }),
    updateEntry: (id: string, data: unknown) => fetchApi(`/timetracking/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEntry: (id: string) => fetchApi(`/timetracking/${id}`, { method: 'DELETE' }),
  },
  permissions: {
    getRoles: () => fetchApi('/permissions/roles'),
    getPermissions: () => fetchApi('/permissions/permissions'),
    updatePermission: (id: string, data: unknown) => fetchApi(`/permissions/permissions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateBulkPermissions: (role: string, permissions: unknown) => fetchApi('/permissions/permissions/bulk', { method: 'POST', body: JSON.stringify({ role_name: role, permissions }) }),
    checkPermission: (role: string, resource: string) => fetchApi(`/permissions/check?role=${role}&resource=${resource}`),
  },
  importExport: {
    importData: (resource: string, data: unknown[]) => fetchApi(`/import/import/${resource}`, { method: 'POST', body: JSON.stringify({ data, format: 'json' }) }),
    importCsv: (resource: string, csvContent: string) => fetchApi(`/import/import-csv/${resource}`, { method: 'POST', body: JSON.stringify({ csvContent }) }),
    exportData: (resource: string, format?: string) => fetchApi(`/export/export/${resource}${format ? `?format=${format}` : ''}`),
    getTemplate: (resource: string) => fetchApi(`/import/templates/${resource}`),
  },
};

export default api;