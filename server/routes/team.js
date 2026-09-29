import express from 'express';
import crypto from 'crypto';
import Joi from 'joi';
import { query } from '../config/db.js';
import { sendTeamInvitationEmail } from '../utils/email.js';
import { hashPassword } from '../utils/password.js';
import { generateToken } from '../middleware/auth.js';
import { ROLES, outranks } from '../config/roles.js';
import { sendError } from '../utils/sendError.js';

const router = express.Router();

/**
 * Roles are hierarchical. `staff` and `accountant` sit at the same level because
 * neither carries team-management rights of its own — they differ in which
 * business data they may touch, not in how much of the team they may control.
 *
 * The invariant enforced throughout this file is: nobody may grant, modify or
 * remove a role at or above their own. Without it, any member who can reach
 * these endpoints could promote themselves to `owner`.
 */
const VALID_ROLES = ROLES;

const inviteSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid(...VALID_ROLES).default('staff'),
});

const acceptSchema = Joi.object({
  token: Joi.string().hex().length(64).required(),
  name: Joi.string().trim().min(2).max(120).required(),
  password: Joi.string().min(8).max(200).required(),
});

const roleUpdateSchema = Joi.object({
  role: Joi.string().valid(...VALID_ROLES).required(),
});

const activeUpdateSchema = Joi.object({
  is_active: Joi.boolean().required(),
});

/** Looks up a member of the current business, 404s when they are not found. */
async function findMember(businessId, userId) {
  const result = await query(
    'SELECT id, name, email, role, is_active FROM users WHERE id = $1 AND business_id = $2',
    [userId, businessId]
  );
  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
}

/** Guards against removing the last owner, which would orphan the business. */
async function isLastOwner(businessId, excludeUserId) {
  const result = await query(
    "SELECT COUNT(*)::int AS count FROM users WHERE business_id = $1 AND role = 'owner' AND is_active = TRUE AND id <> $2",
    [businessId, excludeUserId]
  );
  return Number(result.rows[0]?.count ?? 0) === 0;
}

router.get('/members', async (req, res) => {
  try {
    // Defence in depth: `requirePermission` already gates this, but a role that
    // can read `team` should still only see itself unless it manages the team.
    if (!outranks(req.user?.role, 'manager')) {
      return res.json([{
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        is_active: true,
      }]);
    }

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
    sendError(res, 500, 'Server error');
  }
});

router.post('/invite', async (req, res) => {
  try {
    const { error, value } = inviteSchema.validate(req.body);
    if (error) return sendError(res, 400, error.details[0].message);

    const { email, role } = value;

    if (!outranks(req.user.role, role)) {
      return sendError(res, 403, 'You cannot grant a role above your own');
    }

    const existing = await query('SELECT id, business_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      if (existing.rows[0].business_id === req.business_id) {
        return sendError(res, 400, 'User is already a member of this business');
      }
      return sendError(res, 400, 'A user with this email already exists in another business. Use a different email.');
    }

    const pendingInvite = await query(
      `SELECT id FROM team_invitations WHERE email = $1 AND business_id = $2 AND status = 'pending' AND expires_at > NOW()`,
      [email, req.business_id]
    );
    if (pendingInvite.rows.length > 0) {
      return sendError(res, 400, 'Invitation already sent to this email');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const business = await query('SELECT name FROM businesses WHERE id = $1', [req.business_id]);

    await query(
      `INSERT INTO team_invitations (business_id, email, role, token, invited_by, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
      [req.business_id, email, role, token, req.user.id, expiresAt]
    );

    sendTeamInvitationEmail(email, {
      token,
      businessName: business.rows[0]?.name || 'a business',
      role,
      invitedBy: req.user.name,
    }).catch(console.error);

    res.status(201).json({ message: 'Invitation sent', email, role });
  } catch (err) {
    console.error('Invite team member error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.get('/invitations', async (req, res) => {
  try {
    if (!outranks(req.user.role, 'manager')) {
      return sendError(res, 403, 'Only managers and above can view invitations');
    }

    // `token` is deliberately excluded: it is a single-use credential that is
    // already delivered by email, and returning it here would let any team
    // manager impersonate an invitee.
    const result = await query(
      `SELECT ti.id, ti.email, ti.role, ti.status, ti.expires_at, ti.created_at,
              u.name as invited_by_name
       FROM team_invitations ti
       LEFT JOIN users u ON ti.invited_by = u.id
       WHERE ti.business_id = $1
       ORDER BY ti.created_at DESC`,
      [req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get invitations error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.delete('/invitations/:id', async (req, res) => {
  try {
    if (!outranks(req.user.role, 'manager')) {
      return sendError(res, 403, 'Only managers and above can revoke invitations');
    }

    const result = await query(
      `DELETE FROM team_invitations WHERE id = $1 AND business_id = $2 RETURNING id`,
      [req.params.id, req.business_id]
    );
    if (result.rows.length === 0) {
      return sendError(res, 404, 'Invitation not found');
    }
    res.json({ message: 'Invitation revoked' });
  } catch (err) {
    console.error('Revoke invitation error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.put('/:id/role', async (req, res) => {
  try {
    const { error, value } = roleUpdateSchema.validate(req.body);
    if (error) return sendError(res, 400, error.details[0].message);
    const { role } = value;

    if (req.params.id === req.user.id) {
      return sendError(res, 403, 'You cannot change your own role');
    }

    const target = await findMember(req.business_id, req.params.id);

    // Neither granting `role` nor touching a member of `target.role` may exceed
    // the caller's own standing.
    if (!outranks(req.user.role, role)) {
      return sendError(res, 403, 'You cannot grant a role above your own');
    }
    if (!outranks(req.user.role, target.role)) {
      return sendError(res, 403, 'You cannot change the role of a member at or above your own level');
    }

    if (target.role === 'owner' && role !== 'owner' && await isLastOwner(req.business_id, target.id)) {
      return sendError(res, 400, 'The business must keep at least one active owner');
    }

    const result = await query(
      `UPDATE users SET role = $1 WHERE id = $2 AND business_id = $3 RETURNING id, name, email, role`,
      [role, target.id, req.business_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.statusCode === 404) return sendError(res, 404, err.message);
    console.error('Update role error:', err);
    sendError(res, 500, 'Server error');
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { error, value } = activeUpdateSchema.validate(req.body);
    if (error) return sendError(res, 400, error.details[0].message);
    const { is_active } = value;

    if (req.params.id === req.user.id) {
      return sendError(res, 403, 'You cannot change your own access');
    }

    const target = await findMember(req.business_id, req.params.id);

    if (!outranks(req.user.role, target.role)) {
      return sendError(res, 403, 'You cannot change the access of a member at or above your own level');
    }

    if (!is_active && target.role === 'owner' && await isLastOwner(req.business_id, target.id)) {
      return sendError(res, 400, 'The business must keep at least one active owner');
    }

    const result = await query(
      `UPDATE users SET is_active = $1 WHERE id = $2 AND business_id = $3 RETURNING id, name, email, is_active`,
      [is_active, target.id, req.business_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.statusCode === 404) return sendError(res, 404, err.message);
    console.error('Update member error:', err);
    sendError(res, 500, 'Server error');
  }
});

/**
 * Public router for the invitee side of the flow. An invitee has no account yet
 * and therefore no JWT, so this cannot sit behind `protect` — the emailed token
 * is the capability. It is mounted before the protected router in app.js.
 */
export const teamPublicRoutes = express.Router();

teamPublicRoutes.post('/accept', async (req, res) => {
  try {
    const { error, value } = acceptSchema.validate(req.body);
    if (error) return sendError(res, 400, error.details[0].message);
    const { token, name, password } = value;

    const inviteResult = await query(
      `SELECT id, business_id, email, role FROM team_invitations
       WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
      [token]
    );

    if (inviteResult.rows.length === 0) {
      return sendError(res, 400, 'Invalid or expired invitation');
    }

    const invite = inviteResult.rows[0];

    const existing = await query('SELECT id FROM users WHERE email = $1', [invite.email]);
    if (existing.rows.length > 0) {
      return sendError(res, 400, 'User already exists');
    }

    // Claim the invitation first so two concurrent accepts cannot both proceed.
    const claimed = await query(
      `UPDATE team_invitations SET status = 'accepted' WHERE id = $1 AND status = 'pending' RETURNING id`,
      [invite.id]
    );
    if (claimed.rows.length === 0) {
      return sendError(res, 400, 'This invitation has already been used');
    }

    const hashedPassword = await hashPassword(password);

    let user;
    try {
      const userResult = await query(
        `INSERT INTO users (business_id, name, email, password, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, business_id`,
        [invite.business_id, name, invite.email, hashedPassword, invite.role]
      );
      user = userResult.rows[0];
    } catch (err) {
      // Roll the claim back so a transient failure does not burn the invite.
      await query(`UPDATE team_invitations SET status = 'pending' WHERE id = $1`, [invite.id]);
      throw err;
    }

    const authToken = generateToken(user);

    res.status(201).json({
      message: 'Account created successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: authToken,
    });
  } catch (err) {
    console.error('Accept invitation error:', err);
    sendError(res, 500, 'Server error');
  }
});

export default router;
