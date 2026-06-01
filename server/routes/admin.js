import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

// Protected by global `protect` + `requirePermission` middleware

router.get('/businesses', async (req, res) => {
  try {
    const result = await query('SELECT role FROM users WHERE id = $1 AND business_id = $2', [req.user.id, req.business_id]);
    const isOwner = result.rows.length && result.rows[0].role === 'owner';
    let businesses;
    if (isOwner) {
      businesses = await query(`
        SELECT b.*,
               u.name as owner_name, u.email as owner_email,
               (SELECT COUNT(*) FROM users WHERE business_id = b.id) as user_count,
               (SELECT COUNT(*) FROM customers WHERE business_id = b.id) as customer_count
        FROM businesses b
        LEFT JOIN users u ON u.business_id = b.id AND u.role = 'owner'
        WHERE b.id = $1
        ORDER BY b.created_at DESC
      `, [req.business_id]);
    } else {
      businesses = await query(`
        SELECT b.*,
               u.name as owner_name, u.email as owner_email,
               (SELECT COUNT(*) FROM users WHERE business_id = b.id) as user_count,
               (SELECT COUNT(*) FROM customers WHERE business_id = b.id) as customer_count
        FROM businesses b
        LEFT JOIN users u ON u.business_id = b.id AND u.role = 'owner'
        WHERE b.id = $1
        ORDER BY b.created_at DESC
      `, [req.business_id]);
    }
    
    res.json(businesses.rows);
  } catch (err) {
    console.error('Admin businesses error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/businesses/:id/status', async (req, res) => {
  try {
    const authResult = await query('SELECT role FROM users WHERE id = $1 AND business_id = $2', [req.user.id, req.business_id]);
    if (!authResult.rows.length || authResult.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only business owner can change status' });
    }
    const { status } = req.body;
    if (!['active', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await query(
      'UPDATE businesses SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, req.params.id]
    );
    
    res.json({ message: 'Business status updated' });
  } catch (err) {
    console.error('Update business status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalBusinesses = await query('SELECT COUNT(*) FROM businesses');
    const activeBusinesses = await query("SELECT COUNT(*) FROM businesses WHERE status = 'active'");
    const pendingBusinesses = await query("SELECT COUNT(*) FROM businesses WHERE status = 'pending'");
    const totalUsers = await query('SELECT COUNT(*) FROM users');
    
    const recentRegistrations = await query(`
      SELECT b.id, b.name, b.created_at, u.email as owner_email
      FROM businesses b
      LEFT JOIN users u ON u.business_id = b.id AND u.role = 'owner'
      ORDER BY b.created_at DESC LIMIT 5
    `);
    
    res.json({
      totalBusinesses: parseInt(totalBusinesses.rows[0].count),
      activeBusinesses: parseInt(activeBusinesses.rows[0].count),
      pendingBusinesses: parseInt(pendingBusinesses.rows[0].count),
      totalUsers: parseInt(totalUsers.rows[0].count),
      recentRegistrations: recentRegistrations.rows,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;