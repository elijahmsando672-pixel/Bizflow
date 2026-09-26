// BizFlow database schema in T-SQL (Microsoft SQL Server).
// Converted from the original PostgreSQL DDL that lived inline in config/db.js.
// No GO batch separators allowed here — the whole string is executed as one
// request batch via the mssql driver.

export const SCHEMA_SQL = `
-- ========================================
-- Core Tables (must be first due to FK)
-- ========================================

IF OBJECT_ID(N'dbo.businesses', N'U') IS NULL
CREATE TABLE dbo.businesses (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(255) NOT NULL,
  email NVARCHAR(255) UNIQUE NOT NULL,
  phone NVARCHAR(50),
  address NVARCHAR(MAX),
  registration_number NVARCHAR(100),
  tax_id NVARCHAR(100),
  logo_url NVARCHAR(MAX),
  status NVARCHAR(20) DEFAULT 'pending',
  timezone NVARCHAR(50) DEFAULT 'Africa/Nairobi',
  currency NVARCHAR(10) DEFAULT 'KES',
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
CREATE TABLE dbo.users (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(255) NOT NULL,
  email NVARCHAR(255) UNIQUE NOT NULL,
  password NVARCHAR(255),
  role NVARCHAR(20) DEFAULT 'staff',
  is_active BIT DEFAULT 1,
  email_verified BIT DEFAULT 0,
  totp_secret NVARCHAR(255),
  totp_enabled BIT DEFAULT 0,
  last_login DATETIME2,
  created_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.social_accounts', N'U') IS NULL
CREATE TABLE dbo.social_accounts (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE CASCADE,
  provider NVARCHAR(50) NOT NULL,
  provider_id NVARCHAR(255) NOT NULL,
  email NVARCHAR(255),
  created_at DATETIME2 DEFAULT GETDATE(),
  UNIQUE(provider, provider_id)
);

-- ========================================
-- MODULE 1: Customers
-- ========================================

IF OBJECT_ID(N'dbo.customers', N'U') IS NULL
CREATE TABLE dbo.customers (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(255) NOT NULL,
  email NVARCHAR(255),
  phone NVARCHAR(50),
  address NVARCHAR(MAX),
  company NVARCHAR(255),
  notes NVARCHAR(MAX),
  credit_limit DECIMAL(12,2) DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

-- ========================================
-- MODULE 2: Products / Inventory
-- ========================================

IF OBJECT_ID(N'dbo.categories', N'U') IS NULL
CREATE TABLE dbo.categories (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(100) NOT NULL,
  description NVARCHAR(MAX),
  parent_id UNIQUEIDENTIFIER REFERENCES categories(id),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.products', N'U') IS NULL
CREATE TABLE dbo.products (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  sku NVARCHAR(100),
  barcode NVARCHAR(100),
  name NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  category_id UNIQUEIDENTIFIER REFERENCES categories(id),
  unit NVARCHAR(20) DEFAULT 'piece',
  cost_price DECIMAL(12,2) DEFAULT 0,
  selling_price DECIMAL(12,2) DEFAULT 0,
  stock_qty INT DEFAULT 0,
  reorder_level INT DEFAULT 10,
  is_active BIT DEFAULT 1,
  image_url NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.stock_movements', N'U') IS NULL
CREATE TABLE dbo.stock_movements (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UNIQUEIDENTIFIER REFERENCES products(id) ON DELETE CASCADE,
  qty_before INT NOT NULL,
  qty_change INT NOT NULL,
  qty_after INT NOT NULL,
  reason NVARCHAR(50) NOT NULL,
  reference_type NVARCHAR(50),
  reference_id UNIQUEIDENTIFIER,
  created_at DATETIME2 DEFAULT GETDATE()
);

-- ========================================
-- MODULE 3: Sales / Invoicing
-- ========================================

IF OBJECT_ID(N'dbo.sales', N'U') IS NULL
CREATE TABLE dbo.sales (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UNIQUEIDENTIFIER REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number NVARCHAR(50) NOT NULL,
  status NVARCHAR(20) DEFAULT 'draft',
  sale_date DATE DEFAULT CAST(GETDATE() AS DATE),
  due_date DATE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  paid_date DATETIME2,
  notes NVARCHAR(MAX),
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  UNIQUE(business_id, invoice_number)
);

IF OBJECT_ID(N'dbo.sale_items', N'U') IS NULL
CREATE TABLE dbo.sale_items (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  sale_id UNIQUEIDENTIFIER REFERENCES sales(id) ON DELETE CASCADE,
  product_id UNIQUEIDENTIFIER REFERENCES products(id) ON DELETE SET NULL,
  product_name NVARCHAR(255) NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  created_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.receipts', N'U') IS NULL
CREATE TABLE dbo.receipts (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  sale_id UNIQUEIDENTIFIER REFERENCES sales(id) ON DELETE CASCADE,
  receipt_number NVARCHAR(50) NOT NULL,
  customer_name NVARCHAR(255),
  customer_phone NVARCHAR(50),
  items NVARCHAR(MAX) NOT NULL,
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  payment_method NVARCHAR(20) DEFAULT 'cash',
  receipt_html NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE(),
  UNIQUE(business_id, receipt_number)
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_receipts_sale' AND object_id = OBJECT_ID(N'dbo.receipts'))
CREATE INDEX idx_receipts_sale ON dbo.receipts(sale_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_receipts_business' AND object_id = OBJECT_ID(N'dbo.receipts'))
CREATE INDEX idx_receipts_business ON dbo.receipts(business_id);

IF OBJECT_ID(N'dbo.invoices', N'U') IS NULL
CREATE TABLE dbo.invoices (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UNIQUEIDENTIFIER REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number NVARCHAR(50) NOT NULL,
  status NVARCHAR(20) DEFAULT 'draft',
  invoice_date DATE DEFAULT CAST(GETDATE() AS DATE),
  due_date DATE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  paid_date DATE,
  notes NVARCHAR(MAX),
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  UNIQUE(business_id, invoice_number)
);

IF OBJECT_ID(N'dbo.invoice_items', N'U') IS NULL
CREATE TABLE dbo.invoice_items (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_id UNIQUEIDENTIFIER REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UNIQUEIDENTIFIER REFERENCES products(id) ON DELETE SET NULL,
  product_name NVARCHAR(255) NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  created_at DATETIME2 DEFAULT GETDATE()
);

-- ========================================
-- MODULE 4: Expenses
-- ========================================

IF OBJECT_ID(N'dbo.expense_categories', N'U') IS NULL
CREATE TABLE dbo.expense_categories (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(100) NOT NULL,
  description NVARCHAR(MAX),
  icon NVARCHAR(50),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.expenses', N'U') IS NULL
CREATE TABLE dbo.expenses (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UNIQUEIDENTIFIER REFERENCES expense_categories(id),
  description NVARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE DEFAULT CAST(GETDATE() AS DATE),
  vendor NVARCHAR(255),
  reference NVARCHAR(100),
  is_receipt_attached BIT DEFAULT 0,
  notes NVARCHAR(MAX),
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

-- ========================================
-- MODULE 5: Creditors / Suppliers
-- ========================================

IF OBJECT_ID(N'dbo.creditors', N'U') IS NULL
CREATE TABLE dbo.creditors (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(255) NOT NULL,
  email NVARCHAR(255),
  phone NVARCHAR(50),
  address NVARCHAR(MAX),
  opening_balance DECIMAL(12,2) DEFAULT 0,
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.creditor_payments', N'U') IS NULL
CREATE TABLE dbo.creditor_payments (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  creditor_id UNIQUEIDENTIFIER REFERENCES creditors(id),
  amount DECIMAL(12,2) NOT NULL,
  date DATE DEFAULT CAST(GETDATE() AS DATE),
  reference NVARCHAR(100),
  notes NVARCHAR(MAX),
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.creditor_purchases', N'U') IS NULL
CREATE TABLE dbo.creditor_purchases (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  creditor_id UNIQUEIDENTIFIER REFERENCES creditors(id),
  reference NVARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE,
  is_paid BIT DEFAULT 0,
  date DATE DEFAULT CAST(GETDATE() AS DATE),
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE()
);

-- ========================================
-- MODULE 6: Cashflow
-- ========================================

IF OBJECT_ID(N'dbo.cashflow_entries', N'U') IS NULL
CREATE TABLE dbo.cashflow_entries (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  entry_type NVARCHAR(10) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE DEFAULT CAST(GETDATE() AS DATE),
  description NVARCHAR(255),
  source_type NVARCHAR(50),
  source_id UNIQUEIDENTIFIER,
  category NVARCHAR(50),
  payment_method NVARCHAR(20),
  reference NVARCHAR(100),
  created_at DATETIME2 DEFAULT GETDATE()
);

-- ========================================
-- MODULE 7: Notifications
-- ========================================

IF OBJECT_ID(N'dbo.notifications', N'U') IS NULL
CREATE TABLE dbo.notifications (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UNIQUEIDENTIFIER REFERENCES users(id),
  title NVARCHAR(255) NOT NULL,
  message NVARCHAR(MAX),
  type NVARCHAR(20) DEFAULT 'info',
  is_read BIT DEFAULT 0,
  read_at DATETIME2,
  link NVARCHAR(255),
  created_at DATETIME2 DEFAULT GETDATE()
);

-- ========================================
-- Password Reset
-- ========================================

IF OBJECT_ID(N'dbo.password_resets', N'U') IS NULL
CREATE TABLE dbo.password_resets (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email NVARCHAR(255) NOT NULL,
  token NVARCHAR(255) NOT NULL,
  expires_at DATETIME2 NOT NULL,
  used BIT DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.refresh_tokens', N'U') IS NULL
CREATE TABLE dbo.refresh_tokens (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE CASCADE,
  token NVARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME2 NOT NULL,
  created_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.otp_codes', N'U') IS NULL
CREATE TABLE dbo.otp_codes (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email NVARCHAR(255),
  phone NVARCHAR(50),
  otp NVARCHAR(6) NOT NULL,
  purpose NVARCHAR(50) NOT NULL DEFAULT 'login',
  attempts INT DEFAULT 0,
  used BIT DEFAULT 0,
  expires_at DATETIME2 NOT NULL,
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_otp_codes_email_purpose' AND object_id = OBJECT_ID(N'dbo.otp_codes'))
CREATE INDEX idx_otp_codes_email_purpose ON dbo.otp_codes(email, purpose);

-- ========================================
-- Security: Failed Login Tracking & Account Lockout
-- ========================================

IF OBJECT_ID(N'dbo.login_attempts', N'U') IS NULL
CREATE TABLE dbo.login_attempts (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email NVARCHAR(255) NOT NULL,
  ip_address NVARCHAR(50) NOT NULL,
  success BIT NOT NULL,
  attempted_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_login_attempts_email_ip' AND object_id = OBJECT_ID(N'dbo.login_attempts'))
CREATE INDEX idx_login_attempts_email_ip ON dbo.login_attempts(email, ip_address, attempted_at);

-- ========================================
-- INDEXES
-- ========================================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_customers_business' AND object_id = OBJECT_ID(N'dbo.customers'))
CREATE INDEX idx_customers_business ON dbo.customers(business_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_products_business' AND object_id = OBJECT_ID(N'dbo.products'))
CREATE INDEX idx_products_business ON dbo.products(business_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_products_category' AND object_id = OBJECT_ID(N'dbo.products'))
CREATE INDEX idx_products_category ON dbo.products(category_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_sales_business' AND object_id = OBJECT_ID(N'dbo.sales'))
CREATE INDEX idx_sales_business ON dbo.sales(business_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_sale_items_sale' AND object_id = OBJECT_ID(N'dbo.sale_items'))
CREATE INDEX idx_sale_items_sale ON dbo.sale_items(sale_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_invoices_business' AND object_id = OBJECT_ID(N'dbo.invoices'))
CREATE INDEX idx_invoices_business ON dbo.invoices(business_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_invoice_items_invoice' AND object_id = OBJECT_ID(N'dbo.invoice_items'))
CREATE INDEX idx_invoice_items_invoice ON dbo.invoice_items(invoice_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_expenses_business' AND object_id = OBJECT_ID(N'dbo.expenses'))
CREATE INDEX idx_expenses_business ON dbo.expenses(business_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_expenses_category' AND object_id = OBJECT_ID(N'dbo.expenses'))
CREATE INDEX idx_expenses_category ON dbo.expenses(category_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_creditors_business' AND object_id = OBJECT_ID(N'dbo.creditors'))
CREATE INDEX idx_creditors_business ON dbo.creditors(business_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_cashflow_business' AND object_id = OBJECT_ID(N'dbo.cashflow_entries'))
CREATE INDEX idx_cashflow_business ON dbo.cashflow_entries(business_id, date);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_notifications_business' AND object_id = OBJECT_ID(N'dbo.notifications'))
CREATE INDEX idx_notifications_business ON dbo.notifications(business_id, is_read);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_stock_movements_product' AND object_id = OBJECT_ID(N'dbo.stock_movements'))
CREATE INDEX idx_stock_movements_product ON dbo.stock_movements(product_id, created_at);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_products_business_sku' AND object_id = OBJECT_ID(N'dbo.products'))
CREATE UNIQUE INDEX idx_products_business_sku ON dbo.products(business_id, sku);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_refresh_tokens_token' AND object_id = OBJECT_ID(N'dbo.refresh_tokens'))
CREATE INDEX idx_refresh_tokens_token ON dbo.refresh_tokens(token);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_password_resets_token' AND object_id = OBJECT_ID(N'dbo.password_resets'))
CREATE INDEX idx_password_resets_token ON dbo.password_resets(token);

-- ========================================
-- Audit Logging: Track sensitive operations
-- ========================================

IF OBJECT_ID(N'dbo.audit_logs', N'U') IS NULL
CREATE TABLE dbo.audit_logs (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE SET NULL,
  action NVARCHAR(100) NOT NULL,
  resource_type NVARCHAR(50),
  resource_id UNIQUEIDENTIFIER,
  details NVARCHAR(MAX),
  ip_address NVARCHAR(50),
  user_agent NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_audit_logs_business' AND object_id = OBJECT_ID(N'dbo.audit_logs'))
CREATE INDEX idx_audit_logs_business ON dbo.audit_logs(business_id, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_audit_logs_user' AND object_id = OBJECT_ID(N'dbo.audit_logs'))
CREATE INDEX idx_audit_logs_user ON dbo.audit_logs(user_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_audit_logs_action' AND object_id = OBJECT_ID(N'dbo.audit_logs'))
CREATE INDEX idx_audit_logs_action ON dbo.audit_logs(action);

-- ========================================
-- FEATURE 1: Team Management & Invitations
-- ========================================

IF OBJECT_ID(N'dbo.team_invitations', N'U') IS NULL
CREATE TABLE dbo.team_invitations (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  email NVARCHAR(255) NOT NULL,
  role NVARCHAR(20) DEFAULT 'staff',
  token NVARCHAR(255) NOT NULL,
  invited_by UNIQUEIDENTIFIER REFERENCES users(id),
  status NVARCHAR(20) DEFAULT 'pending',
  expires_at DATETIME2 NOT NULL,
  created_at DATETIME2 DEFAULT GETDATE(),
  UNIQUE(business_id, token)
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_team_invitations_business' AND object_id = OBJECT_ID(N'dbo.team_invitations'))
CREATE INDEX idx_team_invitations_business ON dbo.team_invitations(business_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_team_invitations_token' AND object_id = OBJECT_ID(N'dbo.team_invitations'))
CREATE INDEX idx_team_invitations_token ON dbo.team_invitations(token);

-- ========================================
-- FEATURE: Email Verification
-- ========================================

IF OBJECT_ID(N'dbo.verification_tokens', N'U') IS NULL
CREATE TABLE dbo.verification_tokens (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email NVARCHAR(255) NOT NULL,
  token NVARCHAR(255) NOT NULL,
  type NVARCHAR(50) NOT NULL DEFAULT 'email_verification',
  expires_at DATETIME2 NOT NULL,
  used BIT DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_verification_tokens_email' AND object_id = OBJECT_ID(N'dbo.verification_tokens'))
CREATE INDEX idx_verification_tokens_email ON dbo.verification_tokens(email, type);

-- ========================================
-- FEATURE: TOTP Backup Codes
-- ========================================

IF OBJECT_ID(N'dbo.totp_backup_codes', N'U') IS NULL
CREATE TABLE dbo.totp_backup_codes (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE CASCADE,
  code NVARCHAR(10) NOT NULL,
  used BIT DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_totp_backup_codes_user' AND object_id = OBJECT_ID(N'dbo.totp_backup_codes'))
CREATE INDEX idx_totp_backup_codes_user ON dbo.totp_backup_codes(user_id);

-- ========================================
-- FEATURE: IP Whitelist
-- ========================================

IF OBJECT_ID(N'dbo.ip_whitelist', N'U') IS NULL
CREATE TABLE dbo.ip_whitelist (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  ip_address NVARCHAR(50) NOT NULL,
  label NVARCHAR(100),
  is_active BIT DEFAULT 1,
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE(),
  UNIQUE(business_id, ip_address)
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_ip_whitelist_business' AND object_id = OBJECT_ID(N'dbo.ip_whitelist'))
CREATE INDEX idx_ip_whitelist_business ON dbo.ip_whitelist(business_id);

-- ========================================
-- FEATURE: Device Management
-- ========================================

IF OBJECT_ID(N'dbo.user_devices', N'U') IS NULL
CREATE TABLE dbo.user_devices (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE CASCADE,
  device_name NVARCHAR(255),
  device_type NVARCHAR(50),
  browser NVARCHAR(100),
  os NVARCHAR(100),
  ip_address NVARCHAR(50),
  last_login DATETIME2 DEFAULT GETDATE(),
  is_current BIT DEFAULT 0,
  is_trusted BIT DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_user_devices_user' AND object_id = OBJECT_ID(N'dbo.user_devices'))
CREATE INDEX idx_user_devices_user ON dbo.user_devices(user_id);

-- ========================================
-- FEATURE 4: Employee / Payroll Management
-- ========================================

IF OBJECT_ID(N'dbo.employees', N'U') IS NULL
CREATE TABLE dbo.employees (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE SET NULL,
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  email NVARCHAR(255),
  phone NVARCHAR(50),
  position NVARCHAR(100),
  department NVARCHAR(100),
  hire_date DATE NOT NULL,
  termination_date DATE,
  status NVARCHAR(20) DEFAULT 'active',
  salary DECIMAL(12,2) DEFAULT 0,
  salary_type NVARCHAR(20) DEFAULT 'monthly',
  bank_name NVARCHAR(100),
  bank_account NVARCHAR(50),
  id_number NVARCHAR(50),
  address NVARCHAR(MAX),
  emergency_contact_name NVARCHAR(100),
  emergency_contact_phone NVARCHAR(50),
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_employees_business' AND object_id = OBJECT_ID(N'dbo.employees'))
CREATE INDEX idx_employees_business ON dbo.employees(business_id);

IF OBJECT_ID(N'dbo.attendance', N'U') IS NULL
CREATE TABLE dbo.attendance (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UNIQUEIDENTIFIER REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in DATETIME2,
  clock_out DATETIME2,
  status NVARCHAR(20) DEFAULT 'present',
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_attendance_employee' AND object_id = OBJECT_ID(N'dbo.attendance'))
CREATE INDEX idx_attendance_employee ON dbo.attendance(employee_id, date);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_attendance_business' AND object_id = OBJECT_ID(N'dbo.attendance'))
CREATE INDEX idx_attendance_business ON dbo.attendance(business_id, date);

IF OBJECT_ID(N'dbo.payroll', N'U') IS NULL
CREATE TABLE dbo.payroll (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UNIQUEIDENTIFIER REFERENCES employees(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_salary DECIMAL(12,2) NOT NULL,
  deductions DECIMAL(12,2) DEFAULT 0,
  bonuses DECIMAL(12,2) DEFAULT 0,
  overtime_hours DECIMAL(10,2) DEFAULT 0,
  overtime_pay DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  net_salary DECIMAL(12,2) NOT NULL,
  status NVARCHAR(20) DEFAULT 'pending',
  pay_date DATE,
  notes NVARCHAR(MAX),
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_payroll_business' AND object_id = OBJECT_ID(N'dbo.payroll'))
CREATE INDEX idx_payroll_business ON dbo.payroll(business_id, period_start);

IF OBJECT_ID(N'dbo.payroll_items', N'U') IS NULL
CREATE TABLE dbo.payroll_items (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  payroll_id UNIQUEIDENTIFIER REFERENCES payroll(id) ON DELETE CASCADE,
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  description NVARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type NVARCHAR(20) NOT NULL,
  created_at DATETIME2 DEFAULT GETDATE()
);

-- ========================================
-- FEATURE 5: (reserved)
-- ========================================

IF OBJECT_ID(N'dbo.payment_history', N'U') IS NULL
CREATE TABLE dbo.payment_history (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency NVARCHAR(10) DEFAULT 'KES',
  status NVARCHAR(20) DEFAULT 'pending',
  payment_method NVARCHAR(50),
  transaction_id NVARCHAR(255),
  invoice_url NVARCHAR(MAX),
  paid_at DATETIME2,
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_payment_history' AND object_id = OBJECT_ID(N'dbo.payment_history'))
CREATE INDEX idx_payment_history ON dbo.payment_history(business_id);

IF OBJECT_ID(N'dbo.mpesa_agents', N'U') IS NULL
CREATE TABLE dbo.mpesa_agents (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(255) NOT NULL,
  phone NVARCHAR(20) NOT NULL,
  mpesa_number NVARCHAR(20) NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 0,
  is_active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE()
);

-- ========================================
-- FEATURE 2: Invoice PDF / Templates
-- ========================================

IF OBJECT_ID(N'dbo.invoice_templates', N'U') IS NULL
CREATE TABLE dbo.invoice_templates (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(100) NOT NULL,
  template_config NVARCHAR(MAX) NOT NULL,
  is_default BIT DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_invoice_templates' AND object_id = OBJECT_ID(N'dbo.invoice_templates'))
CREATE INDEX idx_invoice_templates ON dbo.invoice_templates(business_id);

-- ========================================
-- FEATURE 3: Accounts Receivable / Debtors
-- ========================================

IF OBJECT_ID(N'dbo.debtors', N'U') IS NULL
CREATE TABLE dbo.debtors (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(255) NOT NULL,
  email NVARCHAR(255),
  phone NVARCHAR(50),
  address NVARCHAR(MAX),
  opening_balance DECIMAL(12,2) DEFAULT 0,
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.debtor_payments', N'U') IS NULL
CREATE TABLE dbo.debtor_payments (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  debtor_id UNIQUEIDENTIFIER REFERENCES debtors(id),
  amount DECIMAL(12,2) NOT NULL,
  date DATE DEFAULT CAST(GETDATE() AS DATE),
  reference NVARCHAR(100),
  notes NVARCHAR(MAX),
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.debtor_invoices', N'U') IS NULL
CREATE TABLE dbo.debtor_invoices (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  debtor_id UNIQUEIDENTIFIER REFERENCES debtors(id),
  reference NVARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE,
  is_paid BIT DEFAULT 0,
  date DATE DEFAULT CAST(GETDATE() AS DATE),
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_debtors_business' AND object_id = OBJECT_ID(N'dbo.debtors'))
CREATE INDEX idx_debtors_business ON dbo.debtors(business_id);

-- ========================================
-- FEATURE 6: Saved Reports & Report Schedules
-- ========================================

IF OBJECT_ID(N'dbo.report_schedules', N'U') IS NULL
CREATE TABLE dbo.report_schedules (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(100) NOT NULL,
  report_type NVARCHAR(50) NOT NULL,
  schedule NVARCHAR(20) DEFAULT 'weekly',
  email_recipients NVARCHAR(MAX) DEFAULT '[]',
  filters NVARCHAR(MAX),
  last_run_at DATETIME2,
  next_run_at DATETIME2,
  is_active BIT DEFAULT 1,
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_report_schedules' AND object_id = OBJECT_ID(N'dbo.report_schedules'))
CREATE INDEX idx_report_schedules ON dbo.report_schedules(business_id);

-- ========================================
-- FEATURE 7: AI Insights History
-- ========================================

IF OBJECT_ID(N'dbo.ai_insights', N'U') IS NULL
CREATE TABLE dbo.ai_insights (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  insight_type NVARCHAR(50) NOT NULL,
  content NVARCHAR(MAX) NOT NULL,
  summary NVARCHAR(MAX),
  is_read BIT DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_ai_insights' AND object_id = OBJECT_ID(N'dbo.ai_insights'))
CREATE INDEX idx_ai_insights ON dbo.ai_insights(business_id, created_at DESC);

-- ========================================
-- PHASE 1: CRM - Lead & Opportunity Management
-- ========================================

IF OBJECT_ID(N'dbo.leads', N'U') IS NULL
CREATE TABLE dbo.leads (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  email NVARCHAR(255),
  phone NVARCHAR(50),
  company NVARCHAR(255),
  job_title NVARCHAR(100),
  source NVARCHAR(50),
  status NVARCHAR(20) DEFAULT 'new',
  lead_score INT DEFAULT 0,
  estimated_value DECIMAL(12,2) DEFAULT 0,
  assigned_to UNIQUEIDENTIFIER REFERENCES users(id),
  notes NVARCHAR(MAX),
  converted_customer_id UNIQUEIDENTIFIER REFERENCES customers(id),
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_leads_business' AND object_id = OBJECT_ID(N'dbo.leads'))
CREATE INDEX idx_leads_business ON dbo.leads(business_id, status);

IF OBJECT_ID(N'dbo.customer_activities', N'U') IS NULL
CREATE TABLE dbo.customer_activities (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UNIQUEIDENTIFIER REFERENCES customers(id) ON DELETE CASCADE,
  activity_type NVARCHAR(50) NOT NULL,
  subject NVARCHAR(255),
  description NVARCHAR(MAX),
  scheduled_at DATETIME2,
  completed_at DATETIME2,
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_customer_activities' AND object_id = OBJECT_ID(N'dbo.customer_activities'))
CREATE INDEX idx_customer_activities ON dbo.customer_activities(customer_id, created_at DESC);

-- ========================================
-- PHASE 1: Sales Pipeline
-- ========================================

IF OBJECT_ID(N'dbo.deal_stages', N'U') IS NULL
CREATE TABLE dbo.deal_stages (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(100) NOT NULL,
  order_index INT DEFAULT 0,
  win_probability INT DEFAULT 0,
  color NVARCHAR(7) DEFAULT '#6366f1',
  created_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.deals', N'U') IS NULL
CREATE TABLE dbo.deals (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UNIQUEIDENTIFIER REFERENCES customers(id) ON DELETE SET NULL,
  lead_id UNIQUEIDENTIFIER REFERENCES leads(id) ON DELETE SET NULL,
  name NVARCHAR(255) NOT NULL,
  stage_id UNIQUEIDENTIFIER REFERENCES deal_stages(id) ON DELETE SET NULL,
  value DECIMAL(12,2) DEFAULT 0,
  priority NVARCHAR(20) DEFAULT 'medium',
  expected_close_date DATE,
  actual_close_date DATE,
  assigned_to UNIQUEIDENTIFIER REFERENCES users(id),
  outcome NVARCHAR(20),
  loss_reason NVARCHAR(MAX),
  notes NVARCHAR(MAX),
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_deals_business' AND object_id = OBJECT_ID(N'dbo.deals'))
CREATE INDEX idx_deals_business ON dbo.deals(business_id, stage_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_deals_stage' AND object_id = OBJECT_ID(N'dbo.deals'))
CREATE INDEX idx_deals_stage ON dbo.deals(stage_id, created_at DESC);

IF OBJECT_ID(N'dbo.deal_activities', N'U') IS NULL
CREATE TABLE dbo.deal_activities (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  deal_id UNIQUEIDENTIFIER REFERENCES deals(id) ON DELETE CASCADE,
  activity_type NVARCHAR(50) NOT NULL,
  description NVARCHAR(MAX),
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_deal_activities' AND object_id = OBJECT_ID(N'dbo.deal_activities'))
CREATE INDEX idx_deal_activities ON dbo.deal_activities(deal_id, created_at DESC);

-- ========================================
-- PHASE 1: Support / Ticketing
-- ========================================

IF OBJECT_ID(N'dbo.support_tickets', N'U') IS NULL
CREATE TABLE dbo.support_tickets (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UNIQUEIDENTIFIER REFERENCES customers(id) ON DELETE SET NULL,
  ticket_number NVARCHAR(50) NOT NULL,
  subject NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  priority NVARCHAR(20) DEFAULT 'medium',
  status NVARCHAR(20) DEFAULT 'open',
  category NVARCHAR(50),
  assigned_to UNIQUEIDENTIFIER REFERENCES users(id),
  sla_deadline DATETIME2,
  resolved_at DATETIME2,
  closed_at DATETIME2,
  resolution_notes NVARCHAR(MAX),
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  UNIQUE(business_id, ticket_number)
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_tickets_business' AND object_id = OBJECT_ID(N'dbo.support_tickets'))
CREATE INDEX idx_tickets_business ON dbo.support_tickets(business_id, status);

IF OBJECT_ID(N'dbo.ticket_replies', N'U') IS NULL
CREATE TABLE dbo.ticket_replies (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  ticket_id UNIQUEIDENTIFIER REFERENCES support_tickets(id) ON DELETE CASCADE,
  message NVARCHAR(MAX) NOT NULL,
  is_internal BIT DEFAULT 0,
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_ticket_replies' AND object_id = OBJECT_ID(N'dbo.ticket_replies'))
CREATE INDEX idx_ticket_replies ON dbo.ticket_replies(ticket_id, created_at);

IF OBJECT_ID(N'dbo.sla_configs', N'U') IS NULL
CREATE TABLE dbo.sla_configs (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  category NVARCHAR(50) NOT NULL,
  priority NVARCHAR(20) NOT NULL,
  response_hours INT DEFAULT 24,
  resolution_hours INT DEFAULT 48,
  is_active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE()
);

-- ========================================
-- PHASE 2: Project Management
-- ========================================

IF OBJECT_ID(N'dbo.projects', N'U') IS NULL
CREATE TABLE dbo.projects (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  status NVARCHAR(20) DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12,2),
  customer_id UNIQUEIDENTIFIER REFERENCES customers(id) ON DELETE SET NULL,
  assigned_to UNIQUEIDENTIFIER REFERENCES users(id),
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_projects_business' AND object_id = OBJECT_ID(N'dbo.projects'))
CREATE INDEX idx_projects_business ON dbo.projects(business_id, status);

IF OBJECT_ID(N'dbo.project_tasks', N'U') IS NULL
CREATE TABLE dbo.project_tasks (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  project_id UNIQUEIDENTIFIER REFERENCES projects(id) ON DELETE CASCADE,
  title NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  status NVARCHAR(20) DEFAULT 'todo',
  priority NVARCHAR(20) DEFAULT 'medium',
  assignee_id UNIQUEIDENTIFIER REFERENCES users(id),
  due_date DATE,
  estimated_hours DECIMAL(10,2),
  actual_hours DECIMAL(10,2),
  completed_at DATETIME2,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_project_tasks' AND object_id = OBJECT_ID(N'dbo.project_tasks'))
CREATE INDEX idx_project_tasks ON dbo.project_tasks(project_id, status);

IF OBJECT_ID(N'dbo.time_entries', N'U') IS NULL
CREATE TABLE dbo.time_entries (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UNIQUEIDENTIFIER REFERENCES users(id),
  project_id UNIQUEIDENTIFIER REFERENCES projects(id) ON DELETE SET NULL,
  task_id UNIQUEIDENTIFIER REFERENCES project_tasks(id) ON DELETE SET NULL,
  customer_id UNIQUEIDENTIFIER REFERENCES customers(id) ON DELETE SET NULL,
  description NVARCHAR(MAX),
  date DATE DEFAULT CAST(GETDATE() AS DATE),
  start_time DATETIME2,
  end_time DATETIME2,
  duration_minutes INT,
  is_billable BIT DEFAULT 1,
  billed_amount DECIMAL(10,2) DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_time_entries' AND object_id = OBJECT_ID(N'dbo.time_entries'))
CREATE INDEX idx_time_entries ON dbo.time_entries(user_id, date);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_time_entries_project' AND object_id = OBJECT_ID(N'dbo.time_entries'))
CREATE INDEX idx_time_entries_project ON dbo.time_entries(project_id);

-- ========================================
-- PHASE 2: Procurement & Purchase Orders
-- ========================================

IF OBJECT_ID(N'dbo.vendors', N'U') IS NULL
CREATE TABLE dbo.vendors (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(255) NOT NULL,
  email NVARCHAR(255),
  phone NVARCHAR(50),
  address NVARCHAR(MAX),
  contact_person NVARCHAR(100),
  payment_terms NVARCHAR(50),
  rating DECIMAL(2,1),
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_vendors_business' AND object_id = OBJECT_ID(N'dbo.vendors'))
CREATE INDEX idx_vendors_business ON dbo.vendors(business_id);

IF OBJECT_ID(N'dbo.purchase_orders', N'U') IS NULL
CREATE TABLE dbo.purchase_orders (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  po_number NVARCHAR(50) NOT NULL,
  vendor_id UNIQUEIDENTIFIER REFERENCES vendors(id) ON DELETE SET NULL,
  status NVARCHAR(20) DEFAULT 'draft',
  order_date DATE DEFAULT CAST(GETDATE() AS DATE),
  expected_delivery DATE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  notes NVARCHAR(MAX),
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  UNIQUE(business_id, po_number)
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_po_business' AND object_id = OBJECT_ID(N'dbo.purchase_orders'))
CREATE INDEX idx_po_business ON dbo.purchase_orders(business_id, status);

IF OBJECT_ID(N'dbo.po_items', N'U') IS NULL
CREATE TABLE dbo.po_items (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  po_id UNIQUEIDENTIFIER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UNIQUEIDENTIFIER REFERENCES products(id) ON DELETE SET NULL,
  product_name NVARCHAR(255) NOT NULL,
  qty INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  created_at DATETIME2 DEFAULT GETDATE()
);

-- ========================================
-- PHASE 4: Granular Permissions
-- ========================================

IF OBJECT_ID(N'dbo.permissions', N'U') IS NULL
CREATE TABLE dbo.permissions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  role_name NVARCHAR(50) NOT NULL,
  resource NVARCHAR(50) NOT NULL,
  can_create BIT DEFAULT 0,
  can_read BIT DEFAULT 1,
  can_update BIT DEFAULT 0,
  can_delete BIT DEFAULT 0,
  UNIQUE(business_id, role_name, resource),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_permissions' AND object_id = OBJECT_ID(N'dbo.permissions'))
CREATE INDEX idx_permissions ON dbo.permissions(business_id, role_name);

-- ========================================
-- MODULE 14: Shops
-- ========================================

IF OBJECT_ID(N'dbo.shops', N'U') IS NULL
CREATE TABLE dbo.shops (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(255) NOT NULL,
  location NVARCHAR(MAX),
  phone NVARCHAR(50),
  email NVARCHAR(255),
  status NVARCHAR(20) DEFAULT 'active',
  manager_name NVARCHAR(255),
  opening_time TIME DEFAULT '08:00',
  closing_time TIME DEFAULT '18:00',
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.reviews', N'U') IS NULL
CREATE TABLE dbo.reviews (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UNIQUEIDENTIFIER REFERENCES customers(id) ON DELETE SET NULL,
  customer_name NVARCHAR(255),
  product_id UNIQUEIDENTIFIER REFERENCES products(id) ON DELETE SET NULL,
  product_name NVARCHAR(255),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment NVARCHAR(MAX),
  status NVARCHAR(20) DEFAULT 'published',
  created_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.messages', N'U') IS NULL
CREATE TABLE dbo.messages (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  sender_name NVARCHAR(255),
  sender_email NVARCHAR(255),
  subject NVARCHAR(255),
  body NVARCHAR(MAX),
  is_read BIT DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.quotations', N'U') IS NULL
CREATE TABLE dbo.quotations (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UNIQUEIDENTIFIER REFERENCES customers(id) ON DELETE SET NULL,
  customer_name NVARCHAR(255),
  quotation_number NVARCHAR(50) NOT NULL,
  status NVARCHAR(20) DEFAULT 'pending',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  valid_until DATE,
  notes NVARCHAR(MAX),
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  UNIQUE(business_id, quotation_number)
);

-- ========================================
-- System: Action Logs (audit trail for user actions)
-- ========================================

IF OBJECT_ID(N'dbo.action_logs', N'U') IS NULL
CREATE TABLE dbo.action_logs (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE SET NULL,
  action NVARCHAR(100) NOT NULL,
  result NVARCHAR(20) NOT NULL DEFAULT 'success',
  resource_type NVARCHAR(50),
  resource_id UNIQUEIDENTIFIER,
  details NVARCHAR(MAX),
  ip_address NVARCHAR(50),
  browser NVARCHAR(200),
  device NVARCHAR(200),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_action_logs_business' AND object_id = OBJECT_ID(N'dbo.action_logs'))
CREATE INDEX idx_action_logs_business ON dbo.action_logs(business_id, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_action_logs_user' AND object_id = OBJECT_ID(N'dbo.action_logs'))
CREATE INDEX idx_action_logs_user ON dbo.action_logs(user_id);

-- ========================================
-- System: Login History (user access tracking)
-- ========================================

IF OBJECT_ID(N'dbo.login_history', N'U') IS NULL
CREATE TABLE dbo.login_history (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE CASCADE,
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  ip_address NVARCHAR(50) NOT NULL,
  user_agent NVARCHAR(MAX),
  browser NVARCHAR(200),
  os NVARCHAR(200),
  device NVARCHAR(200),
  location NVARCHAR(255),
  success BIT NOT NULL DEFAULT 1,
  failure_reason NVARCHAR(100),
  session_id NVARCHAR(255),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_login_history_user' AND object_id = OBJECT_ID(N'dbo.login_history'))
CREATE INDEX idx_login_history_user ON dbo.login_history(user_id, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_login_history_business' AND object_id = OBJECT_ID(N'dbo.login_history'))
CREATE INDEX idx_login_history_business ON dbo.login_history(business_id, created_at DESC);

-- ========================================
-- System: Webhooks
-- ========================================

IF OBJECT_ID(N'dbo.webhooks', N'U') IS NULL
CREATE TABLE dbo.webhooks (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(100) NOT NULL,
  url NVARCHAR(500) NOT NULL,
  secret NVARCHAR(255),
  event NVARCHAR(100) NOT NULL,
  is_active BIT DEFAULT 1,
  last_triggered_at DATETIME2,
  failure_count INT DEFAULT 0,
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_webhooks_business' AND object_id = OBJECT_ID(N'dbo.webhooks'))
CREATE INDEX idx_webhooks_business ON dbo.webhooks(business_id, event);

-- ========================================
-- System: API Keys
-- ========================================

IF OBJECT_ID(N'dbo.api_keys', N'U') IS NULL
CREATE TABLE dbo.api_keys (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  name NVARCHAR(100) NOT NULL,
  key_hash NVARCHAR(255) NOT NULL UNIQUE,
  key_prefix NVARCHAR(10) NOT NULL,
  scopes NVARCHAR(MAX) DEFAULT '["read"]',
  permissions NVARCHAR(MAX) DEFAULT '{}',
  ip_whitelist NVARCHAR(MAX),
  rate_limit INT DEFAULT 100,
  is_active BIT DEFAULT 1,
  last_used_at DATETIME2,
  expires_at DATETIME2,
  created_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_api_keys_business' AND object_id = OBJECT_ID(N'dbo.api_keys'))
CREATE INDEX idx_api_keys_business ON dbo.api_keys(business_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_api_keys_prefix' AND object_id = OBJECT_ID(N'dbo.api_keys'))
CREATE INDEX idx_api_keys_prefix ON dbo.api_keys(key_prefix);

-- ========================================
-- System: Push Notification Subscriptions
-- ========================================

IF OBJECT_ID(N'dbo.push_subscriptions', N'U') IS NULL
CREATE TABLE dbo.push_subscriptions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE CASCADE,
  business_id UNIQUEIDENTIFIER REFERENCES businesses(id) ON DELETE CASCADE,
  endpoint NVARCHAR(MAX) NOT NULL UNIQUE,
  p256dh_key NVARCHAR(MAX) NOT NULL,
  auth_key NVARCHAR(MAX) NOT NULL,
  device_name NVARCHAR(255),
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_push_subs_user' AND object_id = OBJECT_ID(N'dbo.push_subscriptions'))
CREATE INDEX idx_push_subs_user ON dbo.push_subscriptions(user_id);

-- ========================================
-- Security: Temp Tokens (opaque short-lived, e.g. TOTP pre-auth)
-- ========================================

IF OBJECT_ID(N'dbo.temp_tokens', N'U') IS NULL
CREATE TABLE dbo.temp_tokens (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE CASCADE,
  token_hash NVARCHAR(255) NOT NULL UNIQUE,
  purpose NVARCHAR(50) NOT NULL DEFAULT 'totp_preauth',
  expires_at DATETIME2 NOT NULL,
  used BIT DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_temp_tokens_hash' AND object_id = OBJECT_ID(N'dbo.temp_tokens'))
CREATE INDEX idx_temp_tokens_hash ON dbo.temp_tokens(token_hash);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_temp_tokens_user' AND object_id = OBJECT_ID(N'dbo.temp_tokens'))
CREATE INDEX idx_temp_tokens_user ON dbo.temp_tokens(user_id);

-- ========================================
-- Post-initial additions (formerly migrations 002-005)
-- ========================================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_deal_stages_business' AND object_id = OBJECT_ID(N'dbo.deal_stages'))
CREATE INDEX idx_deal_stages_business ON dbo.deal_stages(business_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_sale_items_business' AND object_id = OBJECT_ID(N'dbo.sale_items'))
CREATE INDEX idx_sale_items_business ON dbo.sale_items(business_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_deals_business' AND object_id = OBJECT_ID(N'dbo.deals'))
CREATE INDEX idx_deals_business ON dbo.deals(business_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_users_business_email' AND object_id = OBJECT_ID(N'dbo.users'))
CREATE UNIQUE INDEX idx_users_business_email ON dbo.users(business_id, email);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_customers_business_email' AND object_id = OBJECT_ID(N'dbo.customers'))
CREATE UNIQUE INDEX idx_customers_business_email ON dbo.customers(business_id, email) WHERE email IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_vendors_business_email' AND object_id = OBJECT_ID(N'dbo.vendors'))
CREATE UNIQUE INDEX idx_vendors_business_email ON dbo.vendors(business_id, email) WHERE email IS NOT NULL;
`;