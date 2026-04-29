import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

router.get('/profit-loss', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = end_date || new Date().toISOString();
    const businessId = req.business_id;

    const revenue = await query(
      `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE business_id = $1 AND status = 'paid' AND sale_date BETWEEN $2 AND $3`,
      [businessId, startDate, endDate]
    );
    const expenses = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE business_id = $1 AND date BETWEEN $2 AND $3`,
      [businessId, startDate, endDate]
    );
    const cogs = await query(
      `SELECT COALESCE(SUM(si.qty * p.cost_price), 0) as total
       FROM sale_items si LEFT JOIN products p ON si.product_id = p.id
       WHERE si.business_id = $1 AND si.created_at BETWEEN $2 AND $3`,
      [businessId, startDate, endDate]
    );

    const totalRevenue = parseFloat(revenue.rows[0].total);
    const totalExpenses = parseFloat(expenses.rows[0].total);
    const totalCOGS = parseFloat(cogs.rows[0].total);
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    const expensesByCategory = await query(
      `SELECT ec.name as category, COALESCE(SUM(e.amount), 0) as total
       FROM expenses e LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.business_id = $1 AND e.date BETWEEN $2 AND $3
       GROUP BY ec.id, ec.name ORDER BY total DESC`,
      [businessId, startDate, endDate]
    );

    const revenueByMonth = await query(
      `SELECT TO_CHAR(sale_date, 'YYYY-MM') as month, SUM(total) as revenue
       FROM sales WHERE business_id = $1 AND status = 'paid' AND sale_date BETWEEN $2 AND $3
       GROUP BY TO_CHAR(sale_date, 'YYYY-MM') ORDER BY month`,
      [businessId, startDate, endDate]
    );

    res.json({
      period: { start: startDate, end: endDate },
      revenue: totalRevenue,
      cogs: totalCOGS,
      gross_profit: grossProfit,
      gross_margin: totalRevenue > 0 ? (grossProfit / totalRevenue * 100).toFixed(2) : 0,
      expenses: totalExpenses,
      net_profit: netProfit,
      net_margin: totalRevenue > 0 ? (netProfit / totalRevenue * 100).toFixed(2) : 0,
      expenses_by_category: expensesByCategory.rows.map(r => ({ category: r.category, total: parseFloat(r.total) })),
      revenue_by_month: revenueByMonth.rows.map(r => ({ month: r.month, revenue: parseFloat(r.revenue) })),
    });
  } catch (err) {
    console.error('P&L report error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/sales-report', async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();
    const businessId = req.business_id;

    let dateFormat;
    if (group_by === 'month') dateFormat = 'YYYY-MM';
    else if (group_by === 'week') dateFormat = 'IYYY-IW';
    else dateFormat = 'YYYY-MM-DD';

    const salesByPeriod = await query(
      `SELECT TO_CHAR(sale_date, '${dateFormat}') as period,
              COUNT(*) as count, SUM(total) as revenue, AVG(total) as avg_order
       FROM sales WHERE business_id = $1 AND sale_date BETWEEN $2 AND $3
       GROUP BY period ORDER BY period`,
      [businessId, startDate, endDate]
    );

    const topCustomers = await query(
      `SELECT c.name, COUNT(*) as purchase_count, SUM(s.total) as total_spent
       FROM sales s JOIN customers c ON s.customer_id = c.id
       WHERE s.business_id = $1 AND s.sale_date BETWEEN $2 AND $3
       GROUP BY c.id, c.name ORDER BY total_spent DESC LIMIT 10`,
      [businessId, startDate, endDate]
    );

    const topProducts = await query(
      `SELECT p.name, SUM(si.qty) as qty_sold, SUM(si.total) as revenue
       FROM sale_items si JOIN products p ON si.product_id = p.id
       WHERE si.business_id = $1 AND si.created_at BETWEEN $2 AND $3
       GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 10`,
      [businessId, startDate, endDate]
    );

    res.json({
      period: { start: startDate, end: endDate, group_by },
      sales_by_period: salesByPeriod.rows.map(r => ({
        period: r.period, count: parseInt(r.count), revenue: parseFloat(r.revenue), avg_order: parseFloat(r.avg_order),
      })),
      top_customers: topCustomers.rows.map(r => ({ name: r.name, purchase_count: parseInt(r.purchase_count), total_spent: parseFloat(r.total_spent) })),
      top_products: topProducts.rows.map(r => ({ name: r.name, qty_sold: parseInt(r.qty_sold), revenue: parseFloat(r.revenue) })),
    });
  } catch (err) {
    console.error('Sales report error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/inventory-report', async (req, res) => {
  try {
    const businessId = req.business_id;

    const products = await query(
      `SELECT p.*, c.name as category_name,
              COALESCE((SELECT SUM(si.qty) FROM sale_items si WHERE si.product_id = p.id AND si.created_at >= NOW() - INTERVAL '30 days'), 0) as sold_30d
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.business_id = $1 AND p.is_active = true
       ORDER BY p.stock_qty ASC`,
      [businessId]
    );

    const lowStock = products.rows.filter(p => p.stock_qty <= p.reorder_level);
    const outOfStock = products.rows.filter(p => p.stock_qty === 0);
    const totalValue = products.rows.reduce((sum, p) => sum + parseFloat(p.cost_price) * p.stock_qty, 0);

    const stockMovements = await query(
      `SELECT sm.*, p.name as product_name
       FROM stock_movements sm JOIN products p ON sm.product_id = p.id
       WHERE sm.business_id = $1 AND sm.created_at >= NOW() - INTERVAL '30 days'
       ORDER BY sm.created_at DESC LIMIT 50`,
      [businessId]
    );

    res.json({
      total_products: products.rows.length,
      low_stock_count: lowStock.length,
      out_of_stock_count: outOfStock.length,
      total_inventory_value: totalValue,
      products: products.rows.map(p => ({ ...p, cost_price: parseFloat(p.cost_price), selling_price: parseFloat(p.selling_price), sold_30d: parseInt(p.sold_30d) })),
      recent_movements: stockMovements.rows,
    });
  } catch (err) {
    console.error('Inventory report error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/cashflow-report', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = end_date || new Date().toISOString();
    const businessId = req.business_id;

    const inflows = await query(
      `SELECT source_type, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM cashflow_entries WHERE business_id = $1 AND entry_type = 'inflow' AND date BETWEEN $2 AND $3
       GROUP BY source_type ORDER BY total DESC`,
      [businessId, startDate, endDate]
    );

    const outflows = await query(
      `SELECT source_type, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM cashflow_entries WHERE business_id = $1 AND entry_type = 'outflow' AND date BETWEEN $2 AND $3
       GROUP BY source_type ORDER BY total DESC`,
      [businessId, startDate, endDate]
    );

    const totalInflow = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM cashflow_entries WHERE business_id = $1 AND entry_type = 'inflow' AND date BETWEEN $2 AND $3`,
      [businessId, startDate, endDate]
    );

    const totalOutflow = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM cashflow_entries WHERE business_id = $1 AND entry_type = 'outflow' AND date BETWEEN $2 AND $3`,
      [businessId, startDate, endDate]
    );

    const dailyFlow = await query(
      `SELECT date, entry_type, COALESCE(SUM(amount), 0) as total
       FROM cashflow_entries WHERE business_id = $1 AND date BETWEEN $2 AND $3
       GROUP BY date, entry_type ORDER BY date`,
      [businessId, startDate, endDate]
    );

    res.json({
      period: { start: startDate, end: endDate },
      total_inflow: parseFloat(totalInflow.rows[0].total),
      total_outflow: parseFloat(totalOutflow.rows[0].total),
      net_cashflow: parseFloat(totalInflow.rows[0].total) - parseFloat(totalOutflow.rows[0].total),
      inflows_by_source: inflows.rows.map(r => ({ source: r.source_type, total: parseFloat(r.total), count: parseInt(r.count) })),
      outflows_by_source: outflows.rows.map(r => ({ source: r.source_type, total: parseFloat(r.total), count: parseInt(r.count) })),
      daily_flow: dailyFlow.rows.map(r => ({ date: r.date, type: r.entry_type, total: parseFloat(r.total) })),
    });
  } catch (err) {
    console.error('Cashflow report error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/tax-summary', async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();
    const businessId = req.business_id;

    const salesTax = await query(
      `SELECT COALESCE(SUM(tax_amount), 0) as total FROM sales WHERE business_id = $1 AND EXTRACT(YEAR FROM sale_date) = $2`,
      [businessId, targetYear]
    );

    const monthlySales = await query(
      `SELECT TO_CHAR(sale_date, 'MM') as month, COUNT(*) as count, SUM(total) as revenue
       FROM sales WHERE business_id = $1 AND EXTRACT(YEAR FROM sale_date) = $2
       GROUP BY month ORDER BY month`,
      [businessId, targetYear]
    );

    const monthlyExpenses = await query(
      `SELECT TO_CHAR(date, 'MM') as month, SUM(amount) as total
       FROM expenses WHERE business_id = $1 AND EXTRACT(YEAR FROM date) = $2
       GROUP BY month ORDER BY month`,
      [businessId, targetYear]
    );

    res.json({
      year: parseInt(targetYear),
      total_tax_collected: parseFloat(salesTax.rows[0].total),
      monthly_sales: monthlySales.rows.map(r => ({ month: r.month, count: parseInt(r.count), revenue: parseFloat(r.revenue) })),
      monthly_expenses: monthlyExpenses.rows.map(r => ({ month: r.month, total: parseFloat(r.total) })),
    });
  } catch (err) {
    console.error('Tax summary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
