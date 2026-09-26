import { pathToFileURL } from 'node:url';
import { app, configuration, allowedOrigins } from './app.js';
import { initDatabase, isServerless, shutdown } from './config/db.js';
import { stopRateLimitCleanup } from './middleware/security.js';

// Comparing URLs by hand breaks on POSIX paths, so the check goes through
// pathToFileURL. It decides whether this file owns the process, and getting it
// wrong means the API never starts.
export const isDirectRun = (moduleUrl, entry = process.argv[1]) => {
  if (!entry) return false;
  try {
    return moduleUrl === pathToFileURL(entry).href;
  } catch {
    return false;
  }
};

const { missing, warnings } = configuration();
for (const warning of warnings) console.warn(`WARNING: ${warning}`);

if (missing.length > 0) {
  const message = `FATAL ERROR: Missing required environment variables: ${missing.join(', ')}`;
  if (isServerless()) {
    // A serverless instance must stay alive to answer requests, so the health
    // check reports the misconfiguration instead of the process dying here.
    console.error(message);
  } else {
    console.error(message);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5000;

export const startServer = async () => {
  // listen first so health checks pass immediately (render needs this)
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS: ${allowedOrigins.join(', ')}`);
  });

  server.timeout = 30000;
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 35000;

  const stop = async () => {
    console.log('Shutting down gracefully...');
    stopRateLimitCleanup();
    server.close(() => {
      console.log('HTTP server closed');
    });
    await shutdown();
    process.exit(0);
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);

  if (missing.length > 0) return;

  // Schema creation is a deployment step, not a boot step: serverless platforms boot
  // a fresh instance per request, so DDL is opt-in there and driven by
  // server/scripts/init-db.js instead.
  if (process.env.DB_AUTO_INIT === 'false') {
    console.log('DB_AUTO_INIT=false, skipping schema initialization');
    return;
  }

  // TODO: maybe move DB init to before listen? kept failing in CI so we retry here
  const maxRetries = 10;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await initDatabase();
      console.log('Database ready');
      return;
    } catch (error) {
      const isLast = attempt === maxRetries;
      if (!isLast) {
        const delay = Math.min(5000 * Math.pow(2, attempt - 1), 30000);
        console.warn(`DB init attempt ${attempt}/${maxRetries} failed: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error('DB init failed after all retries:', error.message);
        // Don't exit — server stays up for health checks
      }
    }
  }
};

// Only take over the port when executed directly. Importing this file (tests, or a
// serverless function) must have no side effects.
if (isDirectRun(import.meta.url)) {
  await startServer();
}
