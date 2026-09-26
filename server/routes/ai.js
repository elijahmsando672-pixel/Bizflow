import express from 'express';
import { query } from '../config/db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sendError } from '../utils/sendError.js';

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY/GOOGLE_API_KEY not set - AI features will use fallback insights');
}
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

router.get('/insights', async (req, res) => {
  try {
    const businessId = req.business_id;

    const revenue = await query(
      `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE business_id = $1 AND status = 'paid' AND sale_date >= NOW() - INTERVAL '30 days'`,
      [businessId]
    );
    const expenses = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE business_id = $1 AND date >= NOW() - INTERVAL '30 days'`,
      [businessId]
    );
    const prevRevenue = await query(
      `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE business_id = $1 AND status = 'paid' AND sale_date >= NOW() - INTERVAL '60 days' AND sale_date < NOW() - INTERVAL '30 days'`,
      [businessId]
    );
    const customers = await query(
      `SELECT COUNT(*) as count FROM customers WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
      [businessId]
    );
    const lowStock = await query(
      `SELECT COUNT(*) as count FROM products WHERE business_id = $1 AND stock_qty <= reorder_level AND is_active = true`,
      [businessId]
    );
    const topProducts = await query(
      `SELECT p.name, SUM(si.qty) as qty_sold, SUM(si.total) as revenue
       FROM sale_items si JOIN products p ON si.product_id = p.id
       WHERE si.business_id = $1 AND si.created_at >= NOW() - INTERVAL '30 days'
       GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 5`,
      [businessId]
    );
    const recentSales = await query(
      `SELECT sale_date, total FROM sales WHERE business_id = $1 AND status = 'paid' AND sale_date >= NOW() - INTERVAL '90 days' ORDER BY sale_date`,
      [businessId]
    );

    const currentRevenue = parseFloat(revenue.rows[0].total);
    const previousRevenue = parseFloat(prevRevenue.rows[0].total);
    const currentExpenses = parseFloat(expenses.rows[0].total);
    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : 0;

    const data = {
      revenue: { current: currentRevenue, previous: previousRevenue, change: revenueChange },
      expenses: currentExpenses,
      profit: currentRevenue - currentExpenses,
      newCustomers: parseInt(customers.rows[0].count),
      lowStockProducts: parseInt(lowStock.rows[0].count),
      topProducts: topProducts.rows,
      dailySales: recentSales.rows.map(r => ({ date: r.sale_date, total: parseFloat(r.total) })),
    };

    const prompt = `Analyze this business data and provide actionable insights. Keep it concise and practical.
    
Revenue (30 days): KES ${data.revenue.current} (change: ${data.revenue.change}%)
Expenses (30 days): KES ${data.expenses}
Profit: KES ${data.profit}
New Customers: ${data.newCustomers}
Low Stock Items: ${data.lowStockProducts}
Top Products: ${data.topProducts.map(p => `${p.name} (${p.qty_sold} sold, KES ${parseFloat(p.revenue)})`).join(', ')}

Provide:
1. A brief summary (2-3 sentences)
2. 3 specific actionable recommendations
3. Any risks or concerns to watch
4. A growth opportunity`;

    let aiSummary = null;
    try {
      if (!genAI) throw new Error('AI_API_KEY_MISSING');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      aiSummary = result.response.text();
    } catch (aiError) {
      if (aiError.message !== 'AI_API_KEY_MISSING') {
        console.log('AI generation failed, using fallback:', aiError.message);
      }
      aiSummary = generateFallbackInsights(data);
    }

    await query(
      `INSERT INTO ai_insights (business_id, insight_type, content, summary)
       VALUES ($1, 'monthly_summary', $2, $3)`,
      [businessId, JSON.stringify(data), aiSummary]
    );

    res.json({ data, aiSummary, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('AI insights error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.get('/predictions', async (req, res) => {
  try {
    const businessId = req.business_id;

    const salesTrend = await query(
      `SELECT TO_CHAR(sale_date, 'YYYY-MM') as month, SUM(total) as revenue, COUNT(*) as count
       FROM sales WHERE business_id = $1 AND status = 'paid' AND sale_date >= NOW() - INTERVAL '12 months'
       GROUP BY TO_CHAR(sale_date, 'YYYY-MM') ORDER BY month`,
      [businessId]
    );

    const data = salesTrend.rows.map(r => ({
      month: r.month,
      revenue: parseFloat(r.revenue),
      count: parseInt(r.count),
    }));

    let prediction = null;
    try {
      if (!genAI) throw new Error('AI_API_KEY_MISSING');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `Based on these monthly revenue figures, predict the next 3 months. Only return JSON.
Data: ${JSON.stringify(data)}
Return format: {"predictions": [{"month": "2026-05", "predicted_revenue": 10000, "confidence": "medium"}, ...]}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        prediction = JSON.parse(jsonMatch[0]);
      }
    } catch (aiError) {
      if (aiError.message !== 'AI_API_KEY_MISSING') {
        console.log('AI prediction failed, using fallback:', aiError.message);
      }
      prediction = { predictions: data.slice(-3).map((d, i) => ({
        month: getNextMonth(d.month, i + 1),
        predicted_revenue: d.revenue * 1.1,
        confidence: 'low',
      }))};
    }

    res.json(prediction);
  } catch (err) {
    console.error('Predictions error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.get('/history', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM ai_insights WHERE business_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('AI history error:', err);
    sendError(res, 500, 'Server error');
  }
});

function generateFallbackInsights(data) {
  const insights = [];
  
  if (data.profit > 0) {
    insights.push(`Good news: Your business is profitable with KES ${data.profit.toFixed(2)} in net profit this month.`);
  } else {
    insights.push(`Warning: Expenses (KES ${data.expenses.toFixed(2)}) exceed revenue (KES ${data.revenue.current.toFixed(2)}). Review costs immediately.`);
  }
  
  if (parseFloat(data.revenue.change) > 0) {
    insights.push(`Revenue grew ${data.revenue.change}% compared to last month. Keep up the momentum!`);
  } else if (parseFloat(data.revenue.change) < 0) {
    insights.push(`Revenue declined ${Math.abs(data.revenue.change)}%. Consider promotional activities or new customer acquisition.`);
  }
  
  if (data.lowStockProducts > 0) {
    insights.push(`${data.lowStockProducts} products are running low on stock. Reorder to avoid lost sales.`);
  }
  
  if (data.newCustomers === 0) {
    insights.push('No new customers this month. Focus on marketing and customer acquisition.');
  }
  
  return insights.join(' ');
}

function getNextMonth(monthStr, offset) {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1 + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default router;
