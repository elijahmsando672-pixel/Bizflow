import express from 'express';
import { query } from '../config/db.js';
import { sendError } from '../utils/sendError.js';

const router = express.Router();

// Protected by global `protect` + `requirePermission` middleware

router.get('/businesses', async (req, res) => {
  try {
    // Always the caller's own business: the role lookup was only ever used to pick
    // between two identical queries, so the branch just duplicated the same result.
    const businesses = await query(`
      SELECT b.*,
             u.name as owner_name, u.email as owner_email,
             (SELECT COUNT(*) FROM users WHERE business_id = b.id) as user_count,
             (SELECT COUNT(*) FROM customers WHERE business_id = b.id) as customer_count
      FROM businesses b
      LEFT JOIN users u ON u.business_id = b.id AND u.role = 'owner'
      WHERE b.id = $1
      ORDER BY b.created_at DESC
    `, [req.business_id]);

    res.json(businesses.rows);
  } catch (err) {
    console.error('Admin businesses error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.patch('/businesses/:id/status', async (req, res) => {
  try {
    const authResult = await query('SELECT role FROM users WHERE id = $1 AND business_id = $2', [req.user.id, req.business_id]);
    if (!authResult.rows.length || authResult.rows[0].role !== 'owner') {
      return sendError(res, 403, 'Only business owner can change status');
    }
    // Roles are per-business (owner/admin/manager/staff/accountant), so holding owner
    // says nothing about any tenant other than the caller's own. Take the target from
    // the session rather than the path, otherwise any owner could suspend an arbitrary
    // business by guessing its id.
    if (req.params.id && req.params.id !== req.business_id) {
      return sendError(res, 404, 'Business not found');
    }

    const { status } = req.body;
    if (!['active', 'suspended', 'pending'].includes(status)) {
      return sendError(res, 400, 'Invalid status');
    }

    const updated = await query(
      'UPDATE businesses SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, req.business_id]
    );

    if (updated.rowCount === 0) {
      return sendError(res, 404, 'Business not found');
    }

    res.json({ message: 'Business status updated' });
  } catch (err) {
    console.error('Update business status error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalBusinesses = await query('SELECT COUNT(*) FROM businesses WHERE id = $1', [req.business_id]);
    const totalUsers = await query('SELECT COUNT(*) FROM users WHERE business_id = $1', [req.business_id]);
    
    res.json({
      totalBusinesses: parseInt(totalBusinesses.rows[0].count),
      totalUsers: parseInt(totalUsers.rows[0].count),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    sendError(res, 500, 'Server error');
  }
});

export default router;