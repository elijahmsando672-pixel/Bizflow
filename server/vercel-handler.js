/**
 * Vercel serverless entry point.
 *
 * Vercel routes /api/* to this function and Express sees the original path, so no
 * path rewriting is needed for the API itself. Extra aliases exist for app routes
 * that live outside /api (the OAuth callbacks), because vercel.json rewrites them
 * into a prefixed path that has to be restored before Express routes them.
 */
import app from './app.js';
import { isServerless } from './config/db.js';

const PREFIX_ALIASES = [
  ['/api/_auth', '/auth'],
];

// Vercel caps request bodies at 4.5 MB regardless of the Express body parser limit.
const PLATFORM_BODY_LIMIT = Number.parseInt(process.env.PLATFORM_BODY_LIMIT_BYTES || '4608000', 10);

export const restorePath = (url = '/') =>
  PREFIX_ALIASES.reduce((current, [prefix, target]) => {
    if (current === prefix) return target;
    if (current.startsWith(`${prefix}/`)) return `${target}${current.slice(prefix.length)}`;
    return current;
  }, url);

const exceedsPlatformLimit = (req) => {
  if (!isServerless()) return false;
  const declared = Number.parseInt(req.headers?.['content-length'] || '0', 10);
  return declared > PLATFORM_BODY_LIMIT;
};

export default async function handler(req, res) {
  if (exceedsPlatformLimit(req)) {
    // A serverless response is a raw ServerResponse, so the Express helpers that
    // app.js relies on are not available here.
    const body = JSON.stringify({ success: false, message: 'Request body too large for this hosting platform' });
    res.writeHead(413, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
    res.end(body);
    return undefined;
  }

  req.url = restorePath(req.url);
  return app(req, res);
}
