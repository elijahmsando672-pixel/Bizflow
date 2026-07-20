import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { sendError } from '../utils/sendError.js';

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not set');
  }
  return process.env.JWT_SECRET;
};

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'No token provided');
  }

  const JWT_SECRET = getJwtSecret();
  if (!JWT_SECRET) {
    return sendError(res, 500, 'Server configuration error');
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userResult = await query(
      `SELECT u.is_active, b.status as business_status
       FROM users u JOIN businesses b ON u.business_id = b.id
       WHERE u.id = $1`,
      [decoded.id]
    );
    if (!userResult.rows.length || !userResult.rows[0].is_active) {
      return sendError(res, 401, 'Account is deactivated');
    }
    if (userResult.rows[0].business_status === 'suspended') {
      return sendError(res, 403, 'Business account is suspended');
    }
    req.user = decoded;
    req.business_id = decoded.business_id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token expired');
    }
    return sendError(res, 401, 'Invalid token');
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