import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import net from 'node:net';

dotenv.config();

const { Pool } = pg;

const RENDER_DB_IPS = [
  { region: 'oregon', host: '35.227.164.209' },
  { region: 'ohio', host: '3.129.155.172' },
  { region: 'frankfurt', host: '3.65.142.85' },
  { region: 'singapore', host: '13.214.97.86' },
  { region: 'virginia', host: '54.87.193.254' },
];

const tcpConnect = (host, port = 5432, timeout = 3000) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
};

const resolveRenderHost = async () => {
  for (const { region, host } of RENDER_DB_IPS) {
    if (await tcpConnect(host)) {
      console.log(`DB host reachable: ${region} (${host})`);
      return host;
    }
  }
  return null;
};

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || 'localhost'),
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || 'bizflow'),
  user: process.env.DATABASE_URL ? undefined : (process.env.DB_USER || 'postgres'),
  password: process.env.DATABASE_URL ? undefined : (process.env.DB_PASSWORD || 'postgres'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err.message);
});

export const query = (text, params) => pool.query(text, params);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const initDatabase = async (retries = 10, baseDelay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (!process.env.DATABASE_URL) {
        const ip = await resolveRenderHost();
        if (ip) {
          console.log(`Using reachable DB IP: ${ip}`);
          pool.options.host = ip;
        } else if (process.env.DB_HOST?.startsWith('dpg-')) {
          console.error('Could not reach Render DB. Set DATABASE_URL env var manually in Render dashboard.');
        }
      }

      // Test the connection before running schema
      const client = await pool.connect();
      client.release();
      console.log(`DB connection established (attempt ${attempt})`);

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
      password VARCHAR(255),
      role VARCHAR(20) DEFAULT 'staff',
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS social_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      provider VARCHAR(50) NOT NULL,
      provider_id VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider, provider_id)
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
      paid_date TIMESTAMP,
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

    CREATE TABLE IF NOT EXISTS receipts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
      receipt_number VARCHAR(50) UNIQUE NOT NULL,
      customer_name VARCHAR(255),
      customer_phone VARCHAR(50),
      items JSONB NOT NULL,
      subtotal DECIMAL(12,2) DEFAULT 0,
      discount_amount DECIMAL(12,2) DEFAULT 0,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      total DECIMAL(12,2) DEFAULT 0,
      payment_method VARCHAR(20) DEFAULT 'cash',
      receipt_html TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_receipts_sale ON receipts(sale_id);
    CREATE INDEX IF NOT EXISTS idx_receipts_business ON receipts(business_id);

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
    -- FEATURE 5: (reserved)
    -- ========================================

    CREATE TABLE IF NOT EXISTS payment_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'KES',
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

    -- ========================================
    -- PHASE 1: CRM - Lead & Opportunity Management
    -- ========================================

    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      company VARCHAR(255),
      job_title VARCHAR(100),
      source VARCHAR(50),
      status VARCHAR(20) DEFAULT 'new',
      lead_score INTEGER DEFAULT 0,
      estimated_value DECIMAL(12,2) DEFAULT 0,
      assigned_to UUID REFERENCES users(id),
      notes TEXT,
      converted_customer_id UUID REFERENCES customers(id),
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_leads_business ON leads(business_id, status);

    CREATE TABLE IF NOT EXISTS customer_activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
      activity_type VARCHAR(50) NOT NULL,
      subject VARCHAR(255),
      description TEXT,
      scheduled_at TIMESTAMP,
      completed_at TIMESTAMP,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_customer_activities ON customer_activities(customer_id, created_at DESC);

    -- ========================================
    -- PHASE 1: Sales Pipeline
    -- ========================================

    CREATE TABLE IF NOT EXISTS deal_stages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      order_index INTEGER DEFAULT 0,
      win_probability INTEGER DEFAULT 0,
      color VARCHAR(7) DEFAULT '#6366f1',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      stage_id UUID REFERENCES deal_stages(id) ON DELETE SET NULL,
      value DECIMAL(12,2) DEFAULT 0,
      priority VARCHAR(20) DEFAULT 'medium',
      expected_close_date DATE,
      actual_close_date DATE,
      assigned_to UUID REFERENCES users(id),
      outcome VARCHAR(20),
      loss_reason TEXT,
      notes TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_deals_business ON deals(business_id, stage_id);
    CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS deal_activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
      activity_type VARCHAR(50) NOT NULL,
      description TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_deal_activities ON deal_activities(deal_id, created_at DESC);

    -- ========================================
    -- PHASE 1: Support / Ticketing
    -- ========================================

    CREATE TABLE IF NOT EXISTS support_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      ticket_number VARCHAR(50) UNIQUE NOT NULL,
      subject VARCHAR(255) NOT NULL,
      description TEXT,
      priority VARCHAR(20) DEFAULT 'medium',
      status VARCHAR(20) DEFAULT 'open',
      category VARCHAR(50),
      assigned_to UUID REFERENCES users(id),
      sla_deadline TIMESTAMP,
      resolved_at TIMESTAMP,
      closed_at TIMESTAMP,
      resolution_notes TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_business ON support_tickets(business_id, status);

    CREATE TABLE IF NOT EXISTS ticket_replies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      is_internal BOOLEAN DEFAULT false,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_ticket_replies ON ticket_replies(ticket_id, created_at);

    CREATE TABLE IF NOT EXISTS sla_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      category VARCHAR(50) NOT NULL,
      priority VARCHAR(20) NOT NULL,
      response_hours INTEGER DEFAULT 24,
      resolution_hours INTEGER DEFAULT 48,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ========================================
    -- PHASE 2: Project Management
    -- ========================================

    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'active',
      start_date DATE,
      end_date DATE,
      budget DECIMAL(12,2),
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      assigned_to UUID REFERENCES users(id),
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_projects_business ON projects(business_id, status);

    CREATE TABLE IF NOT EXISTS project_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'todo',
      priority VARCHAR(20) DEFAULT 'medium',
      assignee_id UUID REFERENCES users(id),
      due_date DATE,
      estimated_hours DECIMAL(10,2),
      actual_hours DECIMAL(10,2),
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_project_tasks ON project_tasks(project_id, status);

    CREATE TABLE IF NOT EXISTS time_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id),
      project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
      task_id UUID REFERENCES project_tasks(id) ON DELETE SET NULL,
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      description TEXT,
      date DATE DEFAULT CURRENT_DATE,
      start_time TIMESTAMP,
      end_time TIMESTAMP,
      duration_minutes INTEGER,
      is_billable BOOLEAN DEFAULT true,
      billed_amount DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_time_entries ON time_entries(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);

    -- ========================================
    -- PHASE 2: Procurement & Purchase Orders
    -- ========================================

    CREATE TABLE IF NOT EXISTS vendors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      contact_person VARCHAR(100),
      payment_terms VARCHAR(50),
      rating DECIMAL(2,1),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_vendors_business ON vendors(business_id);

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      po_number VARCHAR(50) UNIQUE NOT NULL,
      vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
      status VARCHAR(20) DEFAULT 'draft',
      order_date DATE DEFAULT CURRENT_DATE,
      expected_delivery DATE,
      subtotal DECIMAL(12,2) DEFAULT 0,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      total DECIMAL(12,2) DEFAULT 0,
      notes TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_po_business ON purchase_orders(business_id, status);

    CREATE TABLE IF NOT EXISTS po_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      product_name VARCHAR(255) NOT NULL,
      qty INTEGER NOT NULL,
      unit_price DECIMAL(12,2) NOT NULL,
      total DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ========================================
    -- PHASE 4: Granular Permissions
    -- ========================================

    CREATE TABLE IF NOT EXISTS permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      role_name VARCHAR(50) NOT NULL,
      resource VARCHAR(50) NOT NULL,
      can_create BOOLEAN DEFAULT false,
      can_read BOOLEAN DEFAULT true,
      can_update BOOLEAN DEFAULT false,
      can_delete BOOLEAN DEFAULT false,
      UNIQUE(business_id, role_name, resource),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_permissions ON permissions(business_id, role_name);

    -- ========================================
    -- MODULE 14: Shops
    -- ========================================

    CREATE TABLE IF NOT EXISTS shops (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      location TEXT,
      phone VARCHAR(50),
      email VARCHAR(255),
      status VARCHAR(20) DEFAULT 'active',
      manager_name VARCHAR(255),
      opening_time TIME DEFAULT '08:00',
      closing_time TIME DEFAULT '18:00',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      customer_name VARCHAR(255),
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      product_name VARCHAR(255),
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      status VARCHAR(20) DEFAULT 'published',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      sender_name VARCHAR(255),
      sender_email VARCHAR(255),
      subject VARCHAR(255),
      body TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      customer_name VARCHAR(255),
      quotation_number VARCHAR(50) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      subtotal DECIMAL(12,2) DEFAULT 0,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      discount_amount DECIMAL(12,2) DEFAULT 0,
      total DECIMAL(12,2) DEFAULT 0,
      valid_until DATE,
      notes TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(business_id, quotation_number)
    );
  `;

      await pool.query(schema);
      console.log('Database schema initialized successfully');

      // Run pending migrations
      await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const migrationsDir = path.join(__dirname, '..', 'migrations');
      if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir)
          .filter(f => f.endsWith('.sql'))
          .sort();

        for (const file of files) {
          const version = file.replace(/\.sql$/, '');
          const existing = await pool.query(
            'SELECT 1 FROM schema_migrations WHERE version = $1',
            [version]
          );
          if (existing.rows.length > 0) continue;

          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          await pool.query(sql);
          await pool.query(
            'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
            [version, file]
          );
          console.log(`  Migration applied: ${file}`);
        }
      }
      return;
    } catch (err) {
      const isLast = attempt === retries;
      if (isLast) {
        console.error(`DB init failed after ${retries} attempts:`, err.message);
        throw err;
      }
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 30000);
      console.warn(`DB init attempt ${attempt}/${retries} failed: ${err.message}. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
};

const shutdown = async () => {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (err) {
    console.error('Error closing pool:', err.message);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default { pool, query, initDatabase };