import express from 'express';
import crypto from 'crypto';
import Joi from 'joi';
import { query } from '../config/db.js';
import { sendTeamInvitationEmail } from '../utils/email.js';
import { hashPassword } from '../utils/password.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

const inviteSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('owner', 'admin', 'manager', 'staff', 'accountant').default('staff'),
});

router.get('/members', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.last_login, u.created_at,
              b.name as business_name
       FROM users u
       JOIN businesses b ON u.business_id = b.id
       WHERE u.business_id = $1
       ORDER BY u.created_at DESC`,
      [req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get team members error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/invite', async (req, res) => {
  try {
    const { error, value } = inviteSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, role } = value;

    const existing = await query('SELECT id, business_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      if (existing.rows[0].business_id === req.business_id) {
        return res.status(400).json({ error: 'User is already a member of this business' });
      }
      return res.status(400).json({ error: 'A user with this email already exists in another business. Use a different email.' });
    }

    const pendingInvite = await query(
      `SELECT id FROM team_invitations WHERE email = $1 AND business_id = $2 AND status = 'pending' AND expires_at > NOW()`,
      [email, req.business_id]
    );
    if (pendingInvite.rows.length > 0) {
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO team_invitations (business_id, email, role, token, invited_by, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
      [req.business_id, email, role, token, req.user.id, expiresAt]
    );

    sendTeamInvitationEmail(email, { token, businessName: req.user.business_name || 'a business', role, invitedBy: req.user.name }).catch(console.error);

    res.status(201).json({ message: 'Invitation sent', email, role });
  } catch (err) {
    console.error('Invite team member error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/accept', async (req, res) => {
  try {
    const { token, name, password } = req.body;

    const inviteResult = await query(
      `SELECT * FROM team_invitations WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
      [token]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    const invite = inviteResult.rows[0];

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [invite.email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const userResult = await query(
      `INSERT INTO users (business_id, name, email, password, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, business_id`,
      [invite.business_id, name, invite.email, hashedPassword, invite.role]
    );

    await query(`UPDATE team_invitations SET status = 'accepted' WHERE id = $1`, [invite.id]);

    const user = userResult.rows[0];
    const authToken = generateToken(user);

    res.status(201).json({
      message: 'Account created successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: authToken,
    });
  } catch (err) {
    console.error('Accept invitation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/invitations', async (req, res) => {
  try {
    const result = await query(
      `SELECT ti.*, u.name as invited_by_name
       FROM team_invitations ti
       LEFT JOIN users u ON ti.invited_by = u.id
       WHERE ti.business_id = $1
       ORDER BY ti.created_at DESC`,
      [req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get invitations error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/invitations/:id', async (req, res) => {
  try {
    const result = await query(
      `DELETE FROM team_invitations WHERE id = $1 AND business_id = $2 RETURNING id`,
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    res.json({ message: 'Invitation revoked' });
  } catch (err) {
    console.error('Revoke invitation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['owner', 'admin', 'manager', 'staff', 'accountant'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await query(
      `UPDATE users SET role = $1 WHERE id = $2 AND business_id = $3 RETURNING id, name, email, role`,
      [role, req.params.id, req.business_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { is_active } = req.body;
    const result = await query(
      `UPDATE users SET is_active = $1 WHERE id = $2 AND business_id = $3 RETURNING id, name, email, is_active`,
      [is_active, req.params.id, req.business_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update member error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
