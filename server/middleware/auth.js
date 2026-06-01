import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not set');
  }
  return process.env.JWT_SECRET;
};

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const JWT_SECRET = getJwtSecret();
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userResult = await query('SELECT is_active FROM users WHERE id = $1', [decoded.id]);
    if (!userResult.rows.length || !userResult.rows[0].is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }
    req.user = decoded;
    req.business_id = decoded.business_id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const generateToken = (user) => {
  const JWT_SECRET = getJwtSecret();
  return jwt.sign(
    { id: user.id, email: user.email, business_id: user.business_id, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

export const JWT_SECRET_KEY = process.env.JWT_SECRET;