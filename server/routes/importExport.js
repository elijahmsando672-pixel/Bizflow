import express from 'express';
import { query } from '../config/db.js';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { sendError } from '../utils/sendError.js';

const router = express.Router();

const RESOURCE_CONFIG = {
  customers: {
    table: 'customers',
    columns: ['name', 'email', 'phone', 'company', 'address', 'notes', 'credit_limit'],
    required: ['name'],
  },
  products: {
    table: 'products',
    columns: ['name', 'sku', 'category', 'price', 'stock_qty', 'description', 'reorder_level', 'cost_price'],
    required: ['name', 'price'],
  },
  leads: {
    table: 'leads',
    columns: ['first_name', 'last_name', 'email', 'phone', 'company', 'job_title', 'source', 'status', 'estimated_value', 'notes'],
    required: ['first_name'],
  },
  vendors: {
    table: 'vendors',
    columns: ['name', 'email', 'phone', 'contact_person', 'address', 'payment_terms', 'notes'],
    required: ['name'],
  },
  employees: {
    table: 'employees',
    columns: ['first_name', 'last_name', 'email', 'phone', 'position', 'department', 'hire_date', 'status'],
    required: ['first_name', 'email'],
  },
  invoices: {
    table: 'invoices',
    columns: ['customer_id', 'invoice_number', 'total', 'status', 'due_date', 'notes'],
    required: ['customer_id', 'total'],
  },
  expenses: {
    table: 'expenses',
    columns: ['description', 'amount', 'category', 'expense_date', 'status', 'receipt_url'],
    required: ['description', 'amount'],
  },
  deals: {
    table: 'deals',
    columns: ['name', 'lead_id', 'stage_id', 'value', 'probability', 'expected_close_date', 'notes'],
    required: ['name'],
  },
  tickets: {
    table: 'support_tickets',
    columns: ['subject', 'description', 'priority', 'status', 'customer_id', 'assignee_id'],
    required: ['subject'],
  },
};

const VALID_COLUMN_RE = /^[a-z_]+$/;
const validateColumnNames = (columns) => {
  for (const col of columns) {
    if (!VALID_COLUMN_RE.test(col)) {
      throw new Error(`Invalid column name: ${col}`);
    }
  }
};

router.post('/:resource', async (req, res) => {
  try {
    const { resource } = req.params;
    const config = RESOURCE_CONFIG[resource];
    if (!config) return sendError(res, 400, `Unsupported resource: ${resource}`);
    validateColumnNames(config.columns);

    const { data } = req.body;
    if (!data || !Array.isArray(data)) return sendError(res, 400, 'Invalid data: must be array');

    const results = { success: 0, failed: 0, errors: [], inserted: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const missingFields = config.required.filter(f => !row[f] && row[f] !== 0);
      if (missingFields.length) {
        results.failed++;
        results.errors.push({ row: i + 1, error: `Missing required fields: ${missingFields.join(', ')}` });
        continue;
      }

      try {
        const columns = config.columns.filter(c => row[c] !== undefined && row[c] !== '');
        const values = columns.map(c => row[c]);
        const placeholders = values.map((_, i) => `$${i + 1}`);
        const businessIdCol = 'business_id';
        const allColumns = [businessIdCol, ...columns];
        const allValues = [req.business_id, ...values];
        const allPlaceholders = ['$1', ...placeholders.map((_, i) => `$${i + 2}`)];

        const result = await query(
          `INSERT INTO ${config.table} (${allColumns.join(', ')}) VALUES (${allPlaceholders.join(', ')}) RETURNING id`,
          allValues
        );
        results.success++;
        results.inserted.push(result.rows[0].id);
      } catch (error) {
        results.failed++;
        results.errors.push({ row: i + 1, error: error.message || 'Insert failed' });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Import error:', error);
    sendError(res, 500, 'Server error');
  }
});

router.post('/csv/:resource', async (req, res) => {
  try {
    const { resource } = req.params;
    const config = RESOURCE_CONFIG[resource];
    if (!config) return sendError(res, 400, `Unsupported resource: ${resource}`);
    validateColumnNames(config.columns);

    const { csvContent } = req.body;
    if (!csvContent) return sendError(res, 400, 'csvContent required');

    const rows = [];
    const stream = Readable.from(csvContent);

    await new Promise((resolve, reject) => {
      stream.pipe(csvParser())
        .on('data', row => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    const results = { success: 0, failed: 0, errors: [], inserted: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cleaned = {};
      for (const col of config.columns) {
        if (row[col] !== undefined && row[col] !== '') {
          if (['price', 'estimated_value', 'amount', 'total', 'credit_limit', 'cost_price', 'stock_qty', 'reorder_level', 'probability'].includes(col)) {
            cleaned[col] = parseFloat(row[col]) || 0;
          } else {
            cleaned[col] = row[col];
          }
        }
      }

      const missingFields = config.required.filter(f => !cleaned[f] && cleaned[f] !== 0);
      if (missingFields.length) {
        results.failed++;
        results.errors.push({ row: i + 1, error: `Missing required fields: ${missingFields.join(', ')}` });
        continue;
      }

      try {
        const columns = config.columns.filter(c => cleaned[c] !== undefined && cleaned[c] !== '');
        const values = columns.map(c => cleaned[c]);
        const placeholders = values.map((_, i) => `$${i + 1}`);
        const allColumns = ['business_id', ...columns];
        const allValues = [req.business_id, ...values];
        const allPlaceholders = ['$1', ...placeholders.map((_, i) => `$${i + 2}`)];

        const result = await query(
          `INSERT INTO ${config.table} (${allColumns.join(', ')}) VALUES (${allPlaceholders.join(', ')}) RETURNING id`,
          allValues
        );
        results.success++;
        results.inserted.push(result.rows[0].id);
      } catch (error) {
        results.failed++;
        results.errors.push({ row: i + 1, error: error.message || 'Insert failed' });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Import CSV error:', error);
    sendError(res, 500, 'Server error');
  }
});

router.get('/:resource', async (req, res) => {
  const { resource } = req.params;
  const config = RESOURCE_CONFIG[resource];
  if (!config) return sendError(res, 400, `Unsupported resource: ${resource}`);
  validateColumnNames(config.columns);

  const format = req.query.format || 'json';
  const limit = Math.min(parseInt(req.query.limit) || 10000, 10000);

  try {
    const result = await query(
      `SELECT ${config.columns.join(', ')} FROM ${config.table} WHERE business_id = $1 LIMIT $2`,
      [req.business_id, limit]
    );

    if (format === 'csv') {
      const header = config.columns.join(',');
      const csvRows = result.rows.map(row =>
        config.columns.map(col => {
          const val = row[col] ?? '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(',')
      );
      const csvContent = [header, ...csvRows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${resource}_export.csv"`);
      return res.send(csvContent);
    }

    res.json(result.rows);
  } catch (error) {
    sendError(res, 500, `Failed to export ${resource}: ${error.message}`);
  }
});

router.get('/templates/:resource', (req, res) => {
  try {
    const { resource } = req.params;
    const templates = {
      customers: [{ name: "John Doe", email: "john@example.com", phone: "+254700000000", company: "Acme Corp", address: "Nairobi", notes: "", credit_limit: 0 }],
      products: [{ name: "Product A", sku: "PRD-001", category: "Electronics", price: 1000, stock_qty: 50, description: "", reorder_level: 10, cost_price: 500 }],
      leads: [{ first_name: "Jane", last_name: "Smith", email: "jane@corp.com", phone: "+254700000001", company: "TechCorp", job_title: "CTO", source: "inbound", status: "new", estimated_value: 50000, notes: "" }],
      vendors: [{ name: "Supplier Co", email: "sales@supplier.com", phone: "+254700000002", contact_person: "Bob", address: "Mombasa Rd", payment_terms: "Net 30", notes: "" }],
      employees: [{ first_name: "Alice", last_name: "Johnson", email: "alice@company.com", phone: "+254700000003", position: "Developer", department: "Engineering", hire_date: "2026-01-15", status: "active" }],
      invoices: [{ customer_id: "", invoice_number: "INV-001", total: 5000, status: "pending", due_date: "2026-05-01", notes: "" }],
      expenses: [{ description: "Office supplies", amount: 2500, category: "Operations", expense_date: "2026-04-29", status: "approved", receipt_url: "" }],
      deals: [{ name: "Enterprise Deal", lead_id: "", stage_id: "", value: 100000, probability: 60, expected_close_date: "2026-06-30", notes: "" }],
      tickets: [{ subject: "Login issue", description: "Cannot access dashboard", priority: "high", status: "open", customer_id: "", assignee_id: "" }],
    };

    if (!templates[resource]) return sendError(res, 404, 'No template for this resource');
    res.json(templates[resource]);
  } catch (error) {
    sendError(res, 500, 'Server error');
  }
});

export default router;
