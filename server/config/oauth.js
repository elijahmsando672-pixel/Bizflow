import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import { query } from './db.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_SECRET_KEY as JWT_SECRET } from '../middleware/auth.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, business_id: user.business_id, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

async function findOrCreateUser(profile, provider) {
  const email = profile.emails?.[0]?.value || profile.email;
  const name = profile.displayName || profile.name?.givenName || email?.split('@')[0] || 'User';
  const providerId = profile.id || profile.sub;

  if (!email) return null;

  const existing = await query(
    `SELECT sa.user_id, u.name, u.email, u.role, u.business_id, b.name as business_name
     FROM social_accounts sa
     JOIN users u ON sa.user_id = u.id
     JOIN businesses b ON u.business_id = b.id
     WHERE sa.provider = $1 AND sa.provider_id = $2`,
    [provider, providerId]
  );

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [row.user_id]);
    return {
      user: { id: row.user_id, name: row.name, email: row.email, role: row.role },
      business: { id: row.business_id, name: row.business_name },
    };
  }

  const userByEmail = await query(
    `SELECT u.id, u.name, u.email, u.role, u.business_id, b.name as business_name
     FROM users u JOIN businesses b ON u.business_id = b.id WHERE u.email = $1`,
    [email]
  );

  if (userByEmail.rows.length > 0) {
    const row = userByEmail.rows[0];
    await query(
      'INSERT INTO social_accounts (user_id, provider, provider_id, email) VALUES ($1, $2, $3, $4) ON CONFLICT (provider, provider_id) DO NOTHING',
      [row.id, provider, providerId, email]
    );
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [row.id]);
    return {
      user: { id: row.id, name: row.name, email: row.email, role: row.role },
      business: { id: row.business_id, name: row.business_name },
    };
  }

  const businessResult = await query(
    'INSERT INTO businesses (name, email) VALUES ($1, $2) RETURNING id',
    [name + "'s Business", email]
  );
  const business_id = businessResult.rows[0].id;

  const userResult = await query(
    `INSERT INTO users (business_id, name, email, password, role) VALUES ($1, $2, $3, NULL, 'owner') RETURNING id, name, email, role, business_id`,
    [business_id, name, email]
  );
  const user = userResult.rows[0];

  await query(
    'INSERT INTO social_accounts (user_id, provider, provider_id, email) VALUES ($1, $2, $3, $4)',
    [user.id, provider, providerId, email]
  );

  await query(`INSERT INTO expense_categories (business_id, name) VALUES ($1, 'Rent'), ($1, 'Utilities'), ($1, 'Salaries'), ($1, 'Supplies'), ($1, 'Marketing'), ($1, 'Transport'), ($1, 'Other')`, [business_id]);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    business: { id: business_id, name: name + "'s Business" },
  };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${API_URL.replace(/\/api$/, '')}/auth/google/callback`,
    scope: ['profile', 'email'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const result = await findOrCreateUser(profile, 'google');
      if (!result) return done(null, false, { message: 'No email returned from Google' });
      done(null, result);
    } catch (err) {
      done(err);
    }
  }));
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
  passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    privateKeyString: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    callbackURL: `${API_URL.replace(/\/api$/, '')}/auth/apple/callback`,
    scope: ['name', 'email'],
  }, async (req, accessToken, refreshToken, idToken, profile, done) => {
    try {
      const result = await findOrCreateUser(profile || { id: idToken.sub, email: idToken.email }, 'apple');
      if (!result) return done(null, false, { message: 'No email returned from Apple' });
      done(null, result);
    } catch (err) {
      done(err);
    }
  }));
}

export { passport, generateToken, generateRefreshToken };
