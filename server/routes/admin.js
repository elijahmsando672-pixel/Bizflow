import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/businesses', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const businesses = await query(`
      SELECT b.*, 
             u.name as owner_name, u.email as owner_email,
             (SELECT COUNT(*) FROM users WHERE business_id = b.id) as user_count,
             (SELECT COUNT(*) FROM customers WHERE business_id = b.id) as customer_count
      FROM businesses b
      LEFT JOIN users u ON u.business_id = b.id AND u.role = 'owner'
      ORDER BY b.created_at DESC
    `);
    
    res.json(businesses.rows);
  } catch (err) {
    console.error('Admin businesses error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/businesses/:id/status', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
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
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
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