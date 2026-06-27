import crypto from 'crypto';
import path from 'path';

const ALLOWED_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'text/csv': 'csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const validateFile = (file) => {
  if (!file) return { valid: false, error: 'No file uploaded' };
  if (file.size > MAX_FILE_SIZE) return { valid: false, error: 'File too large (max 10MB)' };
  if (!ALLOWED_MIME_TYPES[file.mimetype]) return { valid: false, error: `File type ${file.mimetype} not allowed` };
  return { valid: true };
};

export const generateFileName = (originalName) => {
  const ext = path.extname(originalName) || '';
  const hash = crypto.randomBytes(16).toString('hex');
  return `${hash}${ext}`;
};

export const getFileExtension = (mimetype) => ALLOWED_MIME_TYPES[mimetype] || 'bin';

export const ALLOWED_TYPES = Object.keys(ALLOWED_MIME_TYPES);
export const ALLOWED_EXTENSIONS = Object.values(ALLOWED_MIME_TYPES);
