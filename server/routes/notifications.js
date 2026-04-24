import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from './auth.js';
import { sendPaymentReminderEmail, sendLowStockAlert } from '../utils/email.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const businessId = req.business_id;
    
    const pendingSales = await query(
      `SELECT s.*, c.name as customer_name, c.email as customer_email
       FROM sales s 
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.business_id = $1 AND s.status = 'draft' AND s.due_date < NOW() - INTERVAL '3 days'`,
      [businessId]
    );
    
    const lowStock = await query(
      'SELECT * FROM products WHERE business_id = $1 AND stock_qty <= reorder_level AND is_active = true',
      [businessId]
    );
    
    const systemNotifications = await query(
      'SELECT * FROM notifications WHERE business_id = $1 AND (read_at IS NULL OR read_at > NOW() - INTERVAL \'7 days\') ORDER BY created_at DESC LIMIT 20',
      [businessId]
    );
    
    res.json({
      overdueSales: pendingSales.rows,
      lowStockProducts: lowStock.rows,
      systemNotifications: systemNotifications.rows,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/send-reminder/:id', authenticate, async (req, res) => {
  try {
    const invoiceResult = await query(
      `SELECT s.*, c.name as customer_name, c.email as customer_email
       FROM sales s 
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = $1 AND s.business_id = $2`,
      [req.params.id, req.business_id]
    );
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    const sale = invoiceResult.rows[0];
    
    if (!sale.customer_email) {
      return res.status(400).json({ error: 'Customer has no email' });
    }
    
    await sendPaymentReminderEmail(sale.customer_email, sale, { name: sale.customer_name });
    
    res.json({ message: 'Reminder sent' });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/low-stock-alert/:productId', authenticate, async (req, res) => {
  try {
    const productResult = await query(
      'SELECT * FROM products WHERE id = $1 AND business_id = $2',
      [req.params.productId, req.business_id]
    );
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Low stock alert noted. Configure email alerts in settings.' });
  } catch (error) {
    console.error('Low stock alert error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/mark-read/:id', authenticate, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND business_id = $2',
      [req.params.id, req.business_id]
    );
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/mark-all-read', authenticate, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET read_at = NOW() WHERE business_id = $1 AND read_at IS NULL',
      [req.business_id]
    );
    res.json({ message: 'All marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;