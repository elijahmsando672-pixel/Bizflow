import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const validateFile = async (file) => {
  if (!file) return { valid: false, error: 'No file uploaded' };
  if (file.size > MAX_FILE_SIZE) return { valid: false, error: 'File too large (max 10MB)' };

  // Magic byte verification — check actual file content, not just the MIME header
  try {
    const buffer = file.buffer || (file.path ? await fs.promises.readFile(file.path).catch(() => null) : null);
    if (!buffer || buffer.length < 12) {
      return { valid: false, error: 'Could not read file content for validation' };
    }
    const type = await fileTypeFromBuffer(buffer);
    if (!type || !ALLOWED_MIME_TYPES.has(type.mime)) {
      return { valid: false, error: `File type not allowed (detected: ${type?.mime || 'unknown'})` };
    }
    return { valid: true, mime: type.mime, ext: type.ext };
  } catch {
    return { valid: false, error: 'File validation failed' };
  }
};

export const generateFileName = (originalName) => {
  const ext = path.extname(originalName) || '';
  const hash = crypto.randomBytes(16).toString('hex');
  return `${hash}${ext}`;
};

export const getFileExtension = (mimetype) => 'bin';

export const ALLOWED_TYPES = [...ALLOWED_MIME_TYPES];
