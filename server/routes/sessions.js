import { Router } from 'express';
import { query } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { getLoginHistory, getActiveSessions } from '../utils/loginHistory.js';
import { logAction } from '../utils/actionLogger.js';

const router = Router();

router.get('/history', async (req, res, next) => {
  try {
    const history = await getLoginHistory(req.user.id);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
});

router.get('/active', async (req, res, next) => {
  try {
    const sessions = await getActiveSessions(req.user.id);
    res.json({ success: true, data: sessions });
  } catch (err) { next(err); }
});

router.post('/revoke/:sessionId', async (req, res, next) => {
  try {
    const r = await query(
      'DELETE FROM refresh_tokens WHERE token = $1 AND user_id = $2 RETURNING id',
      [req.params.sessionId, req.user.id]
    );
    if (!r.rows.length) throw new AppError('Session not found', 404);
    logAction({
      businessId: req.business_id, userId: req.user.id, action: 'Session Revoked', result: 'success',
      resourceType: 'sessions', details: { sessionId: req.params.sessionId },
      ip: req.ip, userAgent: req.get('User-Agent'),
    }).catch(() => {});
    res.json({ success: true, message: 'Session revoked' });
  } catch (err) { next(err); }
});

router.post('/revoke-all', async (req, res, next) => {
  try {
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id]);
    logAction({
      businessId: req.business_id, userId: req.user.id, action: 'All Sessions Revoked', result: 'success',
      resourceType: 'sessions', ip: req.ip, userAgent: req.get('User-Agent'),
    }).catch(() => {});
    res.json({ success: true, message: 'All sessions revoked. You will need to log in again.' });
  } catch (err) { next(err); }
});

export default router;
