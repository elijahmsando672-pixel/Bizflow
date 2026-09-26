import bcrypt from 'bcryptjs';

// Constants for bcrypt (legacy hashes)
const BCRYPT_ROUNDS = 10;

// Argon2id configuration (memoryCost ~ 64MB, timeCost ~ 2, parallelism 1)
const ARGON2_OPTIONS = {
  memoryCost: 2 ** 14, // 16384 KiB = 16MB
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
  saltLength: 16,
};

// argon2 is a native module. Serverless builders do not always ship a prebuilt
// binary for the target runtime, so it is loaded on demand and bcrypt takes over
// when it is unavailable.
let argon2 = null;
let argon2Checked = false;

const loadArgon2 = async () => {
  if (argon2Checked) return argon2;
  argon2Checked = true;
  try {
    const mod = await import('argon2');
    argon2 = mod.default || mod;
  } catch (err) {
    console.warn('argon2 is unavailable, falling back to bcrypt for new hashes:', err.message);
    argon2 = null;
  }
  return argon2;
};

export const hashPassword = async (password) => {
  const lib = await loadArgon2();
  if (lib) {
    try {
      return await lib.hash(password, { ...ARGON2_OPTIONS, type: lib.argon2id });
    } catch (err) {
      console.error('Argon2 hashing failed:', err);
    }
  }
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const verifyPassword = async (password, hash) => {
  if (!hash) return false;

  // Detect hash type by prefix
  if (hash.startsWith('$argon2')) {
    const lib = await loadArgon2();
    if (!lib) return false;
    try {
      return await lib.verify(hash, password);
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

export const needsUpgrade = (hash) => {
  // All new hashes should be argon2; legacy are bcrypt
  return !hash.startsWith('$argon2');
};
