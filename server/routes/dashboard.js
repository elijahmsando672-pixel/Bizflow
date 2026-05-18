import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const businessId = req.business_id;
    
    const totalCustomers = await query(
      'SELECT COUNT(*) as count FROM customers WHERE business_id = $1',
      [businessId]
    );
    
    const totalRevenue = await query(
      `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE business_id = $1 AND status = 'paid'`,
      [businessId]
    );
    
    const pendingPayments = await query(
      `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE business_id = $1 AND status = 'draft'`,
      [businessId]
    );
    
    const totalExpenses = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE business_id = $1`,
      [businessId]
    );
    
    const activeInvoices = await query(
      "SELECT COUNT(*) as count FROM sales WHERE business_id = $1 AND status = 'draft'",
      [businessId]
    );
    
    const lowStockProducts = await query(
      'SELECT COUNT(*) as count FROM products WHERE business_id = $1 AND stock_qty <= reorder_level AND is_active = true',
      [businessId]
    );
    
    const recentSales = await query(
      `SELECT s.*, c.name as customer_name 
       FROM sales s 
       LEFT JOIN customers c ON s.customer_id = c.id 
       WHERE s.business_id = $1 
       ORDER BY s.created_at DESC 
       LIMIT 5`,
      [businessId]
    );
    
    const recentExpenses = await query(
      `SELECT e.*, ec.name as category_name
       FROM expenses e 
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.business_id = $1 
       ORDER BY e.date DESC 
       LIMIT 5`,
      [businessId]
    );

    const cashflowSummary = await query(
      `SELECT 
         COALESCE(SUM(CASE WHEN entry_type = 'inflow' THEN amount ELSE 0 END), 0) as total_inflow,
         COALESCE(SUM(CASE WHEN entry_type = 'outflow' THEN amount ELSE 0 END), 0) as total_outflow
       FROM cashflow_entries WHERE business_id = $1`,
      [businessId]
    );
    
    res.json({
      stats: {
        totalCustomers: parseInt(totalCustomers.rows[0].count),
        totalRevenue: parseFloat(totalRevenue.rows[0].total),
        pendingPayments: parseFloat(pendingPayments.rows[0].total),
        totalExpenses: parseFloat(totalExpenses.rows[0].total),
        activeInvoices: parseInt(activeInvoices.rows[0].count),
        lowStockProducts: parseInt(lowStockProducts.rows[0].count),
        totalInflow: parseFloat(cashflowSummary.rows[0].total_inflow),
        totalOutflow: parseFloat(cashflowSummary.rows[0].total_outflow),
      },
      recentSales: recentSales.rows,
      recentExpenses: recentExpenses.rows,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/revenue-chart', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    let sql;
    
    if (period === 'week') {
      sql = `
        SELECT DATE(sale_date) as date, SUM(total) as revenue 
        FROM sales 
        WHERE business_id = $1 AND status = 'paid' AND sale_date >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(sale_date)
        ORDER BY date
      `;
    } else if (period === 'year') {
      sql = `
        SELECT TO_CHAR(sale_date, 'YYYY-MM') as date, SUM(total) as revenue 
        FROM sales 
        WHERE business_id = $1 AND status = 'paid' AND sale_date >= NOW() - INTERVAL '1 year'
        GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
        ORDER BY date
      `;
    } else {
      sql = `
        SELECT TO_CHAR(sale_date, 'YYYY-MM-DD') as date, SUM(total) as revenue 
        FROM sales 
        WHERE business_id = $1 AND status = 'paid' AND sale_date >= NOW() - INTERVAL '30 days'
        GROUP BY TO_CHAR(sale_date, 'YYYY-MM-DD')
        ORDER BY date
      `;
    }
    
    const result = await query(sql, [req.business_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Revenue chart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/expenses-chart', async (req, res) => {
  try {
    const result = await query(
      `SELECT ec.name as category, COALESCE(SUM(e.amount), 0) as total 
       FROM expenses e 
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.business_id = $1 AND e.date >= NOW() - INTERVAL '30 days'
       GROUP BY ec.name
       ORDER BY total DESC`,
      [req.business_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Expenses chart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/profit-summary', async (req, res) => {
  try {
    const revenue = await query(
      `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE business_id = $1 AND status = 'paid'`,
      [req.business_id]
    );
    
    const expenses = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE business_id = $1`,
      [req.business_id]
    );
    
    const revenueValue = parseFloat(revenue.rows[0].total);
    const expensesValue = parseFloat(expenses.rows[0].total);
    const profit = revenueValue - expensesValue;
    
    res.json({
      revenue: revenueValue,
      expenses: expensesValue,
      profit: profit,
      profitMargin: revenueValue > 0 ? (profit / revenueValue * 100).toFixed(2) : 0,
    });
  } catch (error) {
    console.error('Profit summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.id, p.name, p.sku, p.stock_qty, p.reorder_level, p.selling_price, p.cost_price,
              p.is_active, c.name as category_name,
              (p.reorder_level * 2 - p.stock_qty) as suggested_restock_qty,
              ((p.reorder_level * 2 - p.stock_qty) * p.cost_price) as estimated_restock_cost
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.business_id = $1 AND p.stock_qty <= p.reorder_level AND p.is_active = true
       ORDER BY (p.stock_qty * 1.0 / NULLIF(p.reorder_level, 0)) ASC`,
      [req.business_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/top-products', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period) || 30;
    const result = await query(
      `SELECT p.id, p.name, p.sku, p.stock_qty, p.selling_price,
              c.name as category_name,
              SUM(si.qty) as total_sold,
              COUNT(DISTINCT si.sale_id) as order_count,
              SUM(si.total) as total_revenue,
              AVG(si.unit_price) as avg_selling_price
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       JOIN sales s ON si.sale_id = s.id
       WHERE si.business_id = $1 AND s.status != 'draft'
         AND s.sale_date >= CURRENT_DATE - $2::integer
       GROUP BY p.id, p.name, p.sku, p.stock_qty, p.selling_price, c.name
       ORDER BY total_sold DESC
       LIMIT 10`,
      [req.business_id, days]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/frequent-customers', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period) || 30;
    const result = await query(
      `SELECT c.id, c.name, c.email, c.phone, c.company,
              COUNT(DISTINCT s.id) as total_orders,
              COALESCE(SUM(s.total), 0) as total_spent,
              AVG(s.total) as avg_order_value,
              MAX(s.sale_date) as last_order_date,
              MIN(s.sale_date) as first_order_date
       FROM customers c
       JOIN sales s ON c.id = s.customer_id
       WHERE c.business_id = $1 AND s.status != 'draft'
         AND s.sale_date >= CURRENT_DATE - $2::integer
       GROUP BY c.id, c.name, c.email, c.phone, c.company
       ORDER BY total_spent DESC, total_orders DESC
       LIMIT 10`,
      [req.business_id, days]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Frequent customers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/restock-budget', async (req, res) => {
  try {
    const mult = parseFloat(req.query.multiplier) || 2;
    const lowStock = await query(
      `SELECT p.id, p.name, p.sku, p.stock_qty, p.reorder_level, p.cost_price, p.selling_price,
              c.name as category_name,
              ((p.reorder_level * $2 - p.stock_qty)) as suggested_qty,
              ((p.reorder_level * $2 - p.stock_qty) * p.cost_price) as estimated_cost
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.business_id = $1 AND p.stock_qty <= p.reorder_level AND p.is_active = true
         AND (p.reorder_level * $2 - p.stock_qty) > 0
       ORDER BY estimated_cost DESC`,
      [req.business_id, mult]
    );

    const totalBudget = lowStock.rows.reduce((sum, item) => sum + parseFloat(item.estimated_cost || 0), 0);

    res.json({
      items: lowStock.rows,
      totalBudget: Math.ceil(totalBudget),
      itemCount: lowStock.rows.length,
    });
  } catch (error) {
    console.error('Restock budget error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/restock-budget', async (req, res) => {
  try {
    const { items, vendor_id, notes, multiplier = 2 } = req.body;

    let poCounter = 1000;
    const counterResult = await query(`SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 4) AS INTEGER)), 1000) as max_num FROM purchase_orders WHERE business_id = $1`, [req.business_id]);
    poCounter = counterResult.rows[0].max_num + 1;

    const poNumber = `PO-${poCounter}`;
    const budgetItems = items || [];

    let subtotal = 0;
    for (const item of budgetItems) {
      const qty = Math.max(0, Math.ceil(item.reorder_level * multiplier - item.stock_qty));
      subtotal += qty * parseFloat(item.cost_price || 0);
    }

    const tax = Math.round(subtotal * 0.16);
    const total = subtotal + tax;

    const po = await query(
      `INSERT INTO purchase_orders (business_id, po_number, vendor_id, status, order_date, subtotal, tax_amount, total, notes, created_by)
       VALUES ($1, $2, $3, 'draft', CURRENT_DATE, $4, $5, $6, $7, $8) RETURNING *`,
      [req.business_id, poNumber, vendor_id || null, subtotal, tax, total, notes || 'Auto-generated restock budget', req.user.id]
    );

    for (const item of budgetItems) {
      const qty = Math.max(0, Math.ceil(item.reorder_level * multiplier - item.stock_qty));
      if (qty > 0) {
        await query(
          `INSERT INTO po_items (business_id, po_id, product_id, product_name, qty, unit_price, total)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [req.business_id, po.rows[0].id, item.product_id, item.name, qty, parseFloat(item.cost_price || 0), qty * parseFloat(item.cost_price || 0)]
        );
      }
    }

    res.status(201).json({ message: 'Restock budget created', purchaseOrder: po.rows[0], total });
  } catch (error) {
    console.error('Create restock budget error:', error);
    res.status(500).json({ error: 'Failed to create restock budget' });
  }
});

export default router;