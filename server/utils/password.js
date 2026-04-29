import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

// Constants for bcrypt (legacy hashes)
const BCRYPT_ROUNDS = 10;

// Argon2id configuration (memoryCost ~ 64MB, timeCost ~ 2, parallelism 1)
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 14, // 16384 KiB = 16MB
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
  saltLength: 16,
};

// Hash password using Argon2id (new passwords)
export const hashPassword = async (password) => {
  try {
    return await argon2.hash(password, ARGON2_OPTIONS);
  } catch (err) {
    console.error('Argon2 hashing failed:', err);
    // Fallback to bcrypt if argon2 fails
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }
};

// Verify password (supports both Argon2id and bcrypt hashes)
export const verifyPassword = async (password, hash) => {
  if (!hash) return false;
  
  // Detect hash type by prefix
  if (hash.startsWith('$argon2')) {
    try {
      return await argon2.verify(hash, password);
    } catch (err) {
      // Invalid argon2 hash format
      console.error('Argon2 verify error:', err.message);
      return false;
    }
  } else if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return bcrypt.compare(password, hash);
  }
  
  // Unknown hash format
  console.warn('Unknown password hash format');
  return false;
};

// Pre-hash check to determine if hash needs upgrade
export const needsUpgrade = (hash) => {
  // All new hashes should be argon2; legacy are bcrypt
  return !hash.startsWith('$argon2');
};
