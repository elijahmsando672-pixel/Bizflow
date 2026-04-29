import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bizflow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ...(process.env.NODE_ENV === 'production' && {
    ssl: {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
      ca: process.env.DB_SSL_CA ? process.env.DB_SSL_CA : undefined,
    },
  }),
});

export const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    throw error;
  }
};

export const initDatabase = async () => {
  const schema = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    
    -- ========================================
    -- Core Tables (must be first due to FK)
    -- ========================================

    CREATE TABLE IF NOT EXISTS businesses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      address TEXT,
      registration_number VARCHAR(100),
      tax_id VARCHAR(100),
      logo_url TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
      currency VARCHAR(10) DEFAULT 'KES',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'staff',
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ========================================
    -- MODULE 1: Customers
    -- ========================================

    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      company VARCHAR(255),
      notes TEXT,
      credit_limit DECIMAL(12,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ========================================
    -- MODULE 2: Products / Inventory
    -- ========================================

    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      parent_id UUID REFERENCES categories(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      sku VARCHAR(100) UNIQUE,
      barcode VARCHAR(100),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category_id UUID REFERENCES categories(id),
      unit VARCHAR(20) DEFAULT 'piece',
      cost_price DECIMAL(12,2) DEFAULT 0,
      selling_price DECIMAL(12,2) DEFAULT 0,
      stock_qty INTEGER DEFAULT 0,
      reorder_level INTEGER DEFAULT 10,
      is_active BOOLEAN DEFAULT true,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      qty_before INTEGER NOT NULL,
      qty_change INTEGER NOT NULL,
      qty_after INTEGER NOT NULL,
      reason VARCHAR(50) NOT NULL,
      reference_type VARCHAR(50),
      reference_id UUID,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ========================================
    -- MODULE 3: Sales / Invoicing
    -- ========================================

    CREATE TABLE IF NOT EXISTS sales (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      status VARCHAR(20) DEFAULT 'draft',
      sale_date DATE DEFAULT CURRENT_DATE,
      due_date DATE,
      subtotal DECIMAL(12,2) DEFAULT 0,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      discount_amount DECIMAL(12,2) DEFAULT 0,
      total DECIMAL(12,2) DEFAULT 0,
      amount_paid DECIMAL(12,2) DEFAULT 0,
      notes TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      product_name VARCHAR(255) NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      unit_price DECIMAL(12,2) NOT NULL,
      discount DECIMAL(12,2) DEFAULT 0,
      total DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      status VARCHAR(20) DEFAULT 'draft',
      invoice_date DATE DEFAULT CURRENT_DATE,
      due_date DATE,
      subtotal DECIMAL(12,2) DEFAULT 0,
      discount_amount DECIMAL(12,2) DEFAULT 0,
      total DECIMAL(12,2) DEFAULT 0,
      amount_paid DECIMAL(12,2) DEFAULT 0,
      paid_date DATE,
      notes TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      product_name VARCHAR(255) NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      unit_price DECIMAL(12,2) NOT NULL,
      discount DECIMAL(12,2) DEFAULT 0,
      total DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ========================================
    -- MODULE 4: Expenses
    -- ========================================

    CREATE TABLE IF NOT EXISTS expense_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      icon VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      category_id UUID REFERENCES expense_categories(id),
      description VARCHAR(255) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      date DATE DEFAULT CURRENT_DATE,
      vendor VARCHAR(255),
      reference VARCHAR(100),
      is_receipt_attached BOOLEAN DEFAULT false,
      notes TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ========================================
    -- MODULE 5: Creditors / Suppliers
    -- ========================================

    CREATE TABLE IF NOT EXISTS creditors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      opening_balance DECIMAL(12,2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS creditor_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      creditor_id UUID REFERENCES creditors(id),
      amount DECIMAL(12,2) NOT NULL,
      date DATE DEFAULT CURRENT_DATE,
      reference VARCHAR(100),
      notes TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS creditor_purchases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      creditor_id UUID REFERENCES creditors(id),
      reference VARCHAR(50) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      due_date DATE,
      is_paid BOOLEAN DEFAULT false,
      date DATE DEFAULT CURRENT_DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ========================================
    -- MODULE 6: Cashflow
    -- ========================================

    CREATE TABLE IF NOT EXISTS cashflow_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      entry_type VARCHAR(10) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      date DATE DEFAULT CURRENT_DATE,
      description VARCHAR(255),
      source_type VARCHAR(50),
      source_id UUID,
      category VARCHAR(50),
      payment_method VARCHAR(20),
      reference VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ========================================
    -- MODULE 7: Notifications
    -- ========================================

    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id),
      title VARCHAR(255) NOT NULL,
      message TEXT,
      type VARCHAR(20) DEFAULT 'info',
      is_read BOOLEAN DEFAULT false,
      read_at TIMESTAMP,
      link VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ========================================
    -- Password Reset
    -- ========================================

    CREATE TABLE IF NOT EXISTS password_resets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ========================================
    -- Security: Failed Login Tracking & Account Lockout
    -- ========================================

    CREATE TABLE IF NOT EXISTS login_attempts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL,
      ip_address INET NOT NULL,
      success BOOLEAN NOT NULL,
      attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_login_attempts_email_ip ON login_attempts(email, ip_address, attempted_at);

    -- ========================================
    -- INDEXES
    -- ========================================

    CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
    CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_sales_business ON sales(business_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_business ON invoices(business_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_business ON expenses(business_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
    CREATE INDEX IF NOT EXISTS idx_creditors_business ON creditors(business_id);
    CREATE INDEX IF NOT EXISTS idx_cashflow_business ON cashflow_entries(business_id, date);
    CREATE INDEX IF NOT EXISTS idx_notifications_business ON notifications(business_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id, created_at);

    -- ========================================
    -- Audit Logging: Track sensitive operations
    -- ========================================

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(50),
      resource_id UUID,
      details JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_business ON audit_logs(business_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

    -- ========================================
    -- FEATURE 1: Team Management & Invitations
    -- ========================================

    CREATE TABLE IF NOT EXISTS team_invitations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'staff',
      token VARCHAR(255) NOT NULL UNIQUE,
      invited_by UUID REFERENCES users(id),
      status VARCHAR(20) DEFAULT 'pending',
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_team_invitations_business ON team_invitations(business_id);
    CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);

    -- ========================================
    -- FEATURE 4: Employee / Payroll Management
    -- ========================================

    CREATE TABLE IF NOT EXISTS employees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      position VARCHAR(100),
      department VARCHAR(100),
      hire_date DATE NOT NULL,
      termination_date DATE,
      status VARCHAR(20) DEFAULT 'active',
      salary DECIMAL(12,2) DEFAULT 0,
      salary_type VARCHAR(20) DEFAULT 'monthly',
      bank_name VARCHAR(100),
      bank_account VARCHAR(50),
      id_number VARCHAR(50),
      address TEXT,
      emergency_contact_name VARCHAR(100),
      emergency_contact_phone VARCHAR(50),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_employees_business ON employees(business_id);

    CREATE TABLE IF NOT EXISTS attendance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      clock_in TIMESTAMP,
      clock_out TIMESTAMP,
      status VARCHAR(20) DEFAULT 'present',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id, date);
    CREATE INDEX IF NOT EXISTS idx_attendance_business ON attendance(business_id, date);

    CREATE TABLE IF NOT EXISTS payroll (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      gross_salary DECIMAL(12,2) NOT NULL,
      deductions DECIMAL(12,2) DEFAULT 0,
      bonuses DECIMAL(12,2) DEFAULT 0,
      overtime_hours DECIMAL(10,2) DEFAULT 0,
      overtime_pay DECIMAL(12,2) DEFAULT 0,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      net_salary DECIMAL(12,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      pay_date DATE,
      notes TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_payroll_business ON payroll(business_id, period_start);

    CREATE TABLE IF NOT EXISTS payroll_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      payroll_id UUID REFERENCES payroll(id) ON DELETE CASCADE,
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      description VARCHAR(255) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      type VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ========================================
    -- FEATURE 5: Subscription / Billing Module
    -- ========================================

    CREATE TABLE IF NOT EXISTS subscription_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'USD',
      billing_cycle VARCHAR(20) DEFAULT 'monthly',
      max_users INTEGER DEFAULT 5,
      max_products INTEGER,
      features JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true,
      trial_days INTEGER DEFAULT 14,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS business_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      plan_id UUID REFERENCES subscription_plans(id),
      status VARCHAR(20) DEFAULT 'trial',
      start_date DATE DEFAULT CURRENT_DATE,
      current_period_start DATE,
      current_period_end DATE,
      trial_ends_at TIMESTAMP,
      cancelled_at TIMESTAMP,
      cancelled_by UUID REFERENCES users(id),
      stripe_customer_id VARCHAR(255),
      stripe_subscription_id VARCHAR(255),
      last_payment_date DATE,
      next_billing_date DATE,
      amount DECIMAL(10,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_business_subscriptions ON business_subscriptions(business_id);

    CREATE TABLE IF NOT EXISTS payment_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      subscription_id UUID REFERENCES business_subscriptions(id),
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'USD',
      status VARCHAR(20) DEFAULT 'pending',
      payment_method VARCHAR(50),
      transaction_id VARCHAR(255),
      invoice_url TEXT,
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_payment_history ON payment_history(business_id);

    -- ========================================
    -- FEATURE 2: Invoice PDF / Templates
    -- ========================================

    CREATE TABLE IF NOT EXISTS invoice_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      template_config JSONB NOT NULL,
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_invoice_templates ON invoice_templates(business_id);

    -- ========================================
    -- FEATURE 3: Accounts Receivable / Debtors
    -- ========================================

    CREATE TABLE IF NOT EXISTS debtors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      opening_balance DECIMAL(12,2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS debtor_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      debtor_id UUID REFERENCES debtors(id),
      amount DECIMAL(12,2) NOT NULL,
      date DATE DEFAULT CURRENT_DATE,
      reference VARCHAR(100),
      notes TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS debtor_invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      debtor_id UUID REFERENCES debtors(id),
      reference VARCHAR(50) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      due_date DATE,
      is_paid BOOLEAN DEFAULT false,
      date DATE DEFAULT CURRENT_DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_debtors_business ON debtors(business_id);

    -- ========================================
    -- FEATURE 6: Saved Reports & Report Schedules
    -- ========================================

    CREATE TABLE IF NOT EXISTS report_schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      report_type VARCHAR(50) NOT NULL,
      schedule VARCHAR(20) DEFAULT 'weekly',
      email_recipients JSONB DEFAULT '[]',
      filters JSONB,
      last_run_at TIMESTAMP,
      next_run_at TIMESTAMP,
      is_active BOOLEAN DEFAULT true,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_report_schedules ON report_schedules(business_id);

    -- ========================================
    -- FEATURE 7: AI Insights History
    -- ========================================

    CREATE TABLE IF NOT EXISTS ai_insights (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      insight_type VARCHAR(50) NOT NULL,
      content JSONB NOT NULL,
      summary TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_ai_insights ON ai_insights(business_id, created_at DESC);
  `;

  await pool.query(schema);
  console.log('Database schema initialized successfully');
};

export default { pool, query, initDatabase };