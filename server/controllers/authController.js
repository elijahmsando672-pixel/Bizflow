import jwt from 'jsonwebtoken';
import Joi from 'joi';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { query, pool } from '../config/db.js';
import { sendWelcomeEmail, sendPasswordResetEmail, sendOTPEmail, sendVerificationEmail } from '../utils/email.js';
import { setCsrfCookie, clearCsrfCookie } from '../middleware/csrf.js';
import { reportAccountLockout } from '../utils/securityMonitor.js';
import { JWT_SECRET_KEY as JWT_SECRET } from '../middleware/auth.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import https from 'https';

const APP_NAME = 'BizFlow';
const CAPTCHA_SECRET = process.env.TURNSTILE_SECRET_KEY || '';
const MAX_LOGIN_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const TOTP_WINDOW = 1; // ±30s window for clock drift

// ── CAPTCHA verification (Cloudflare Turnstile) ──────────────
const verifyCaptcha = (token) => {
  return new Promise((resolve) => {
    if (!CAPTCHA_SECRET || !token) return resolve(false);
    const data = `secret=${encodeURIComponent(CAPTCHA_SECRET)}&response=${encodeURIComponent(token)}`;
    const req = https.request({
      hostname: 'challenges.cloudflare.com',
      path: '/turnstile/v0/siteverify',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body).success === true); }
        catch { resolve(false); }
      });
    });
    req.on('error', () => resolve(false));
    req.write(data);
    req.end();
  });
};

// ── Device tracking ──────────────────────────────────────────
const recordDevice = async (userId, req) => {
  const ua = req.get('User-Agent') || '';
  const ip = req.ip || req.socket.remoteAddress;
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/\S+/)?.[0] || 'Unknown';
  const os = ua.match(/\(([^)]+)\)/)?.[1] || 'Unknown';
  const deviceName = `${browser} on ${os}`;

  // Deactivate existing current flag
  await query('UPDATE user_devices SET is_current = false WHERE user_id = $1', [userId]);
  // Upsert device (match by user + device name to avoid duplicates)
  const existing = await query(
    'SELECT id FROM user_devices WHERE user_id = $1 AND device_name = $2',
    [userId, deviceName]
  );
  if (existing.rows.length > 0) {
    await query(
      'UPDATE user_devices SET last_login = NOW(), ip_address = $1, is_current = true WHERE id = $2',
      [ip, existing.rows[0].id]
    );
  } else {
    await query(
      `INSERT INTO user_devices (user_id, device_name, device_type, browser, os, ip_address, is_current)
       VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [userId, deviceName, ua.includes('Mobile') ? 'mobile' : 'desktop', browser, os, ip]
    );
  }
};

// ── IP whitelist check ───────────────────────────────────────
const checkIpWhitelist = async (businessId, ip) => {
  if (!businessId || !ip) return true;
  const entries = await query(
    'SELECT id FROM ip_whitelist WHERE business_id = $1 AND is_active = true',
    [businessId]
  );
  // If no whitelist entries exist, allow all IPs (whitelist is optional)
  if (entries.rows.length === 0) return true;
  const matched = await query(
    'SELECT id FROM ip_whitelist WHERE business_id = $1 AND ip_address = $2 AND is_active = true',
    [businessId, ip]
  );
  return matched.rows.length > 0;
};

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(10).pattern(/[a-z]/).pattern(/[A-Z]/).pattern(/[0-9]/).pattern(/[^a-zA-Z0-9]/).required()
    .messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character', 'string.min': 'Password must be at least 10 characters' }),
  business_name: Joi.string().min(2).max(255).required(),
  phone: Joi.string().pattern(/^[+]?[\d\s-]+$/).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

// bruteforce check — 5 failed attempts = 15min lockout (per-account, not per-IP)
const isLocked = async (email) => {
  const cutoff = new Date(Date.now() - ATTEMPT_WINDOW_MS);
  const result = await query(
    `SELECT COUNT(*) as failed_count FROM login_attempts WHERE email = $1 AND success = false AND attempted_at > $2`,
    [email, cutoff]
  );
  return parseInt(result.rows[0].failed_count) >= MAX_LOGIN_ATTEMPTS;
};

const recordLoginAttempt = async (email, ip, success) => {
  await query('INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, $3)', [email, ip, success]);
};

// short-lived access token, refresh via /auth/refresh-token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, business_id: user.business_id, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

const setRefreshCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true, secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth',
  });
};

export const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password, business_name, phone } = value;
    // don't reveal if email exists — just say "invalid"
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) return res.status(400).json({ error: 'Invalid registration details' });

    const businessResult = await query(
      'INSERT INTO businesses (name, email, phone) VALUES ($1, $2, $3) RETURNING id',
      [business_name, email, phone]
    );
    const business_id = businessResult.rows[0].id;

    const hashedPassword = await hashPassword(password);
    const userResult = await query(
      `INSERT INTO users (business_id, name, email, password, role) VALUES ($1, $2, $3, $4, 'owner') RETURNING id, name, email, role, business_id`,
      [business_id, name, email, hashedPassword]
    );
    const user = userResult.rows[0];

    const token = generateToken(user);
    const refreshToken = generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, refreshToken, refreshExpiresAt]);

    await query(`INSERT INTO expense_categories (business_id, name) VALUES ($1, 'Rent'), ($1, 'Utilities'), ($1, 'Salaries'), ($1, 'Supplies'), ($1, 'Marketing'), ($1, 'Transport'), ($1, 'Other')`, [business_id]);
    const shopResult = await query(
      `INSERT INTO shops (business_id, name) VALUES ($1, 'Main Shop') RETURNING id`,
      [business_id]
    );
    await recordLoginAttempt(email, req.ip, true);

    // Send verification email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const vTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const vExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO verification_tokens (email, token, type, expires_at) VALUES ($1, $2, $3, $4)',
      [email, vTokenHash, 'email_verification', vExpiresAt]
    );
    sendVerificationEmail(email, verificationToken).catch(console.error);
    sendWelcomeEmail(email, { name: user.name, business_name }).catch(console.error);
    const shopsResult = await query('SELECT id, name, location FROM shops WHERE business_id = $1 ORDER BY name', [business_id]);
    setRefreshCookie(res, refreshToken);
    setCsrfCookie(req, res);

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      business: { id: business_id, name: business_name },
      shops: shopsResult.rows,
      token,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = value;
    const ip = req.ip || req.socket.remoteAddress;

    if (await isLocked(email)) {
      reportAccountLockout(email, ip);
      return res.status(429).json({ error: 'Too many failed attempts. Please try again later.' });
    }

    // ── CAPTCHA check: require after 3 failed attempts ──
    const recentFails = await query(
      'SELECT COUNT(*) as cnt FROM login_attempts WHERE email = $1 AND success = false AND attempted_at > NOW() - INTERVAL \'15 minutes\'',
      [email]
    );
    const failCount = parseInt(recentFails.rows[0].cnt);
    if (failCount >= 3) {
      const { captcha_token } = req.body;
      if (!captcha_token) {
        return res.status(400).json({ error: 'CAPTCHA_REQUIRED', message: 'Please complete the security check.' });
      }
      const captchaValid = await verifyCaptcha(captcha_token);
      if (!captchaValid) {
        return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
      }
    }

    const result = await query('SELECT u.*, b.name as business_name FROM users u JOIN businesses b ON u.business_id = b.id WHERE u.email = $1', [email]);
    if (result.rows.length === 0) { await recordLoginAttempt(email, ip, false); return res.status(401).json({ error: 'Invalid credentials' }); }

    const user = result.rows[0];
    if (!user.password) {
      await recordLoginAttempt(email, ip, false);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      await recordLoginAttempt(email, ip, false);
      if (await isLocked(email)) {
        reportAccountLockout(email, ip);
        return res.status(429).json({ error: 'Account temporarily locked.' });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ── IP whitelist check ──
    if (user.business_id) {
      const whitelistOk = await checkIpWhitelist(user.business_id, ip);
      if (!whitelistOk) {
        await recordLoginAttempt(email, ip, false);
        return res.status(403).json({ error: 'Access denied from this IP address.' });
      }
    }

    // ── TOTP check: if enabled, require TOTP token ──
    if (user.totp_enabled) {
      const { totp_token } = req.body;
      if (!totp_token) {
        return res.json({ require_totp: true, temp_token: generateToken(user) });
      }
      const totpValid = authenticator.check(totp_token, user.totp_secret);
      if (!totpValid) {
        // Check backup codes
        if (totp_token.length <= 10) {
          const backup = await query(
            'SELECT id FROM totp_backup_codes WHERE user_id = $1 AND code = $2 AND used = false',
            [user.id, totp_token]
          );
          if (backup.rows.length === 0) {
            await recordLoginAttempt(email, ip, false);
            return res.status(401).json({ error: 'Invalid verification code.' });
          }
          await query('UPDATE totp_backup_codes SET used = true WHERE id = $1', [backup.rows[0].id]);
        } else {
          await recordLoginAttempt(email, ip, false);
          return res.status(401).json({ error: 'Invalid verification code.' });
        }
      }
    }

    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);
    await query('DELETE FROM login_attempts WHERE email = $1 AND success = false', [email]);
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);
    const refreshToken = generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, refreshToken, refreshExpiresAt]);
    await recordLoginAttempt(email, ip, true);
    recordDevice(user.id, req).catch(() => {});

    const { password: _, totp_secret, ...userData } = user;
    const shopsResult = await query('SELECT id, name, location FROM shops WHERE business_id = $1 ORDER BY name', [userData.business_id]);
    setRefreshCookie(res, refreshToken);
    setCsrfCookie(req, res);

    res.json({
      user: { id: userData.id, name: userData.name, email: userData.email, role: userData.role },
      business: { id: userData.business_id, name: userData.business_name },
      shops: shopsResult.rows,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const me = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.business_id, b.name as business_name, b.email as business_email, b.phone, b.address, b.tax_id
       FROM users u JOIN businesses b ON u.business_id = b.id WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    res.clearCookie('refreshToken', { path: '/api/auth', httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    clearCsrfCookie(res);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || Joi.string().email().validate(email).error) {
      return res.json({ message: 'If the email exists in our system, a password reset link will be sent.' });
    }
    const result = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.json({ message: 'If the email exists in our system, a password reset link will be sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await query('INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)', [email, tokenHash, expiresAt]);
    sendPasswordResetEmail(email, resetToken).catch(console.error);
    res.json({ message: 'If the email exists in our system, a password reset link will be sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await query(
      `SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW() AND used = false`,
      [tokenHash]
    );
    const resetRecord = result.rows[0];
    if (!resetRecord) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const userResult = await query('SELECT id FROM users WHERE email = $1', [resetRecord.email]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const passwordValidation = Joi.string().min(10).pattern(/[a-z]/).pattern(/[A-Z]/).pattern(/[0-9]/).pattern(/[^a-zA-Z0-9]/).validate(password);
    if (passwordValidation.error) return res.status(400).json({ error: 'Password must be at least 10 characters with uppercase, lowercase, number, and special character' });

    const hashedPassword = await hashPassword(password);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userResult.rows[0].id]);
      await client.query('UPDATE password_resets SET used = true WHERE id = $1', [resetRecord.id]);
      await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userResult.rows[0].id]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const sendOTP = async (req, res) => {
  try {
    const { email, phone, purpose } = req.body;
    if (!email && !phone) return res.status(400).json({ error: 'Email or phone is required' });
    if (!purpose || !['login', 'password_reset'].includes(purpose)) {
      return res.status(400).json({ error: 'Purpose must be "login" or "password_reset"' });
    }

    if (email) {
      const userExists = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (userExists.rows.length === 0) {
        return res.json({ message: 'If the account exists, an OTP will be sent.' });
      }
    }

    await query('DELETE FROM otp_codes WHERE (email = $1 OR phone = $1) AND purpose = $2 AND used = false', [email || phone, purpose]);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await query(
      'INSERT INTO otp_codes (email, phone, otp, purpose, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [email || null, phone || null, otp, purpose, expiresAt]
    );

    if (email) {
      sendOTPEmail(email, otp, purpose).catch(console.error);
    }
    console.log(`OTP for ${email || phone}: ${otp}`);

    res.json({ message: 'OTP sent successfully', expires_in: 600 });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyOTPLogin = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;
    if ((!email && !phone) || !otp) return res.status(400).json({ error: 'Email/phone and OTP are required' });

    const result = await query(
      `SELECT * FROM otp_codes WHERE (email = $1 OR phone = $1) AND otp = $2 AND purpose = 'login' AND used = false AND expires_at > NOW()`,
      [email || phone, otp]
    );

    if (result.rows.length === 0) {
      const attemptResult = await query(
        `SELECT * FROM otp_codes WHERE (email = $1 OR phone = $1) AND purpose = 'login' AND used = false`,
        [email || phone]
      );
      if (attemptResult.rows.length > 0) {
        const record = attemptResult.rows[0];
        const newAttempts = (record.attempts || 0) + 1;
        if (newAttempts >= 3) {
          await query('UPDATE otp_codes SET used = true WHERE id = $1', [record.id]);
          return res.status(429).json({ error: 'Too many attempts. Request a new OTP.' });
        }
        await query('UPDATE otp_codes SET attempts = $1 WHERE id = $2', [newAttempts, record.id]);
      }
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    const otpRecord = result.rows[0];
    await query('UPDATE otp_codes SET used = true WHERE id = $1', [otpRecord.id]);

    const userResult = await query(
      'SELECT u.*, b.name as business_name FROM users u JOIN businesses b ON u.business_id = b.id WHERE u.email = $1',
      [otpRecord.email]
    );
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = userResult.rows[0];
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);
    const refreshToken = generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, refreshToken, refreshExpiresAt]);

    const { password: _, ...userData } = user;
    const shopsResult = await query('SELECT id, name, location FROM shops WHERE business_id = $1 ORDER BY name', [userData.business_id]);
    setRefreshCookie(res, refreshToken);
    setCsrfCookie(req, res);

    res.json({
      user: { id: userData.id, name: userData.name, email: userData.email, role: userData.role },
      business: { id: userData.business_id, name: userData.business_name },
      shops: shopsResult.rows,
      token,
    });
  } catch (err) {
    console.error('Verify OTP login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyOTPReset = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;
    if ((!email && !phone) || !otp) return res.status(400).json({ error: 'Email/phone and OTP are required' });

    const result = await query(
      `SELECT * FROM otp_codes WHERE (email = $1 OR phone = $1) AND otp = $2 AND purpose = 'password_reset' AND used = false AND expires_at > NOW()`,
      [email || phone, otp]
    );

    if (result.rows.length === 0) {
      const attemptResult = await query(
        `SELECT * FROM otp_codes WHERE (email = $1 OR phone = $1) AND purpose = 'password_reset' AND used = false`,
        [email || phone]
      );
      if (attemptResult.rows.length > 0) {
        const record = attemptResult.rows[0];
        const newAttempts = (record.attempts || 0) + 1;
        if (newAttempts >= 3) {
          await query('UPDATE otp_codes SET used = true WHERE id = $1', [record.id]);
          return res.status(429).json({ error: 'Too many attempts. Request a new OTP.' });
        }
        await query('UPDATE otp_codes SET attempts = $1 WHERE id = $2', [newAttempts, record.id]);
      }
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    const otpRecord = result.rows[0];
    await query('UPDATE otp_codes SET used = true WHERE id = $1', [otpRecord.id]);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await query('INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)', [otpRecord.email, tokenHash, expiresAt]);

    res.json({ message: 'OTP verified', reset_token: resetToken, email: otpRecord.email });
  } catch (err) {
    console.error('Verify OTP reset error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── Email Verification ───────────────────────────────────────
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification token is required' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await query(
      `SELECT * FROM verification_tokens WHERE token = $1 AND type = 'email_verification' AND used = false AND expires_at > NOW()`,
      [tokenHash]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired verification token' });

    const record = result.rows[0];
    await query('UPDATE verification_tokens SET used = true WHERE id = $1', [record.id]);
    await query('UPDATE users SET email_verified = true WHERE email = $1', [record.email]);

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userResult = await query('SELECT id, email_verified FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.json({ message: 'If the account exists, a verification email will be sent.' });
    if (userResult.rows[0].email_verified) return res.json({ message: 'Email is already verified.' });

    // Invalidate old tokens
    await query('UPDATE verification_tokens SET used = true WHERE email = $1 AND type = $2', [email, 'email_verification']);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO verification_tokens (email, token, type, expires_at) VALUES ($1, $2, $3, $4)',
      [email, tokenHash, 'email_verification', expiresAt]
    );

    sendVerificationEmail(email, verificationToken).catch(console.error);
    res.json({ message: 'Verification email sent' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── TOTP / 2FA ──────────────────────────────────────────────
export const setupTOTP = async (req, res) => {
  try {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(req.user.email, APP_NAME, secret);

    await query('UPDATE users SET totp_secret = $1 WHERE id = $2', [secret, req.user.id]);

    const qrCode = await QRCode.toDataURL(otpauth);

    // Generate 8 backup codes
    const codes = [];
    for (let i = 0; i < 8; i++) {
      const code = crypto.randomInt(1000000000, 9999999999).toString();
      codes.push(code);
      await query(
        'INSERT INTO totp_backup_codes (user_id, code) VALUES ($1, $2)',
        [req.user.id, code]
      );
    }

    res.json({ secret, qr_code: qrCode, backup_codes: codes });
  } catch (err) {
    console.error('TOTP setup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyTOTPSetup = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification code is required' });

    const user = await query('SELECT totp_secret FROM users WHERE id = $1', [req.user.id]);
    if (!user.rows[0]?.totp_secret) return res.status(400).json({ error: 'TOTP not set up yet' });

    const valid = authenticator.check(token, user.rows[0].totp_secret);
    if (!valid) return res.status(400).json({ error: 'Invalid verification code' });

    await query('UPDATE users SET totp_enabled = true WHERE id = $1', [req.user.id]);
    res.json({ message: 'Two-factor authentication enabled.' });
  } catch (err) {
    console.error('TOTP verify error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const disableTOTP = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required to disable 2FA' });

    const user = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const valid = await verifyPassword(password, user.rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });

    await query('UPDATE users SET totp_secret = NULL, totp_enabled = false WHERE id = $1', [req.user.id]);
    await query('DELETE FROM totp_backup_codes WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Two-factor authentication disabled.' });
  } catch (err) {
    console.error('TOTP disable error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── Device Management ───────────────────────────────────────
export const getDevices = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, device_name, device_type, browser, os, ip_address, last_login, is_current, is_trusted, created_at FROM user_devices WHERE user_id = $1 ORDER BY last_login DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get devices error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const revokeDevice = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM user_devices WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Device revoked' });
  } catch (err) {
    console.error('Revoke device error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── IP Whitelist ────────────────────────────────────────────
export const getIpWhitelist = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, ip_address, label, is_active, created_at FROM ip_whitelist WHERE business_id = $1 ORDER BY created_at DESC',
      [req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get IP whitelist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const addIpWhitelist = async (req, res) => {
  try {
    const { ip_address, label } = req.body;
    if (!ip_address) return res.status(400).json({ error: 'IP address is required' });

    const result = await query(
      'INSERT INTO ip_whitelist (business_id, ip_address, label, created_by) VALUES ($1, $2, $3, $4) ON CONFLICT (business_id, ip_address) DO UPDATE SET label = $3, is_active = true RETURNING id, ip_address, label',
      [req.business_id, ip_address, label || '', req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Add IP whitelist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const removeIpWhitelist = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM ip_whitelist WHERE id = $1 AND business_id = $2', [id, req.business_id]);
    res.json({ message: 'IP removed from whitelist' });
  } catch (err) {
    console.error('Remove IP whitelist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token provided' });

    const result = await query(
      `SELECT rt.*, u.id as user_id, u.name, u.email, u.role, u.business_id, b.name as business_name
       FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id JOIN businesses b ON u.business_id = b.id
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [refreshToken]
    );

    if (result.rows.length === 0) { res.clearCookie('refreshToken', { path: '/api/auth' }); return res.status(401).json({ error: 'Invalid or expired refresh token' }); }

    const oldTokenRecord = result.rows[0];

    const newRefreshToken = generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query('DELETE FROM refresh_tokens WHERE id = $1', [oldTokenRecord.id]);
    await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [oldTokenRecord.user_id, newRefreshToken, refreshExpiresAt]);

    const userForToken = { id: oldTokenRecord.user_id, email: oldTokenRecord.email, business_id: oldTokenRecord.business_id, role: oldTokenRecord.role };
    const accessToken = generateToken(userForToken);

    setRefreshCookie(res, newRefreshToken);
    res.json({ token: accessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const csrfToken = (req, res) => {
  const token = setCsrfCookie(req, res);
  res.json({ csrfToken: token });
};
