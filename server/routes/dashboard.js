import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
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

router.get('/revenue-chart', authenticate, async (req, res) => {
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

router.get('/expenses-chart', authenticate, async (req, res) => {
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

router.get('/profit-summary', authenticate, async (req, res) => {
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

export default router;