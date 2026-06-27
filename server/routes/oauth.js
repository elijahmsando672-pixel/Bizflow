import express from 'express';
import { passport, generateToken, generateRefreshToken } from '../config/oauth.js';
import { setCsrfCookie } from '../middleware/csrf.js';
import { query } from '../config/db.js';

const router = express.Router();
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const CLIENT_CALLBACK = `${APP_URL}/auth/callback`;

const setRefreshCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true, secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth',
  });
};

function buildRedirectUrl(user, business) {
  const token = generateToken(user);
  const params = new URLSearchParams({
    token,
    userId: user.id,
    businessId: business.id,
  });
  return `${CLIENT_CALLBACK}?${params.toString()}`;
}

router.get('/google', passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${APP_URL}/login?error=google_auth_failed` }),
  async (req, res) => {
    try {
      const { user, business } = req.user;

      const refreshToken = generateRefreshToken();
      const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);
      await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, refreshToken, refreshExpiresAt]);

      setRefreshCookie(res, refreshToken);
      setCsrfCookie(req, res);

      res.redirect(buildRedirectUrl(user, business));
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect(`${APP_URL}/login?error=server_error`);
    }
  }
);

router.get('/apple', passport.authenticate('apple', { session: false }));

router.post('/apple/callback',
  passport.authenticate('apple', { session: false, failureRedirect: `${APP_URL}/login?error=apple_auth_failed` }),
  async (req, res) => {
    try {
      const { user, business } = req.user;

      const refreshToken = generateRefreshToken();
      const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);
      await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, refreshToken, refreshExpiresAt]);

      setRefreshCookie(res, refreshToken);
      setCsrfCookie(req, res);

      res.redirect(buildRedirectUrl(user, business));
    } catch (err) {
      console.error('Apple callback error:', err);
      res.redirect(`${APP_URL}/login?error=server_error`);
    }
  }
);

router.get('/microsoft', passport.authenticate('microsoft', { session: false }));

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: `${APP_URL}/login?error=microsoft_auth_failed` }),
  async (req, res) => {
    try {
      const { user, business } = req.user;

      const refreshToken = generateRefreshToken();
      const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);
      await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, refreshToken, refreshExpiresAt]);

      setRefreshCookie(res, refreshToken);
      setCsrfCookie(req, res);

      res.redirect(buildRedirectUrl(user, business));
    } catch (err) {
      console.error('Microsoft callback error:', err);
      res.redirect(`${APP_URL}/login?error=server_error`);
    }
  }
);

export default router;
