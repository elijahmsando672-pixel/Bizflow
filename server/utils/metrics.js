const metrics = {
  requestCount: 0,
  errorCount: 0,
  failedRequestCount: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  statusCodes: {},
  endpoints: {},
  startTime: Date.now(),
};

export const trackRequest = (req, res, timeMs) => {
  metrics.requestCount++;
  metrics.totalResponseTime += timeMs;
  if (timeMs < metrics.minResponseTime) metrics.minResponseTime = timeMs;
  if (timeMs > metrics.maxResponseTime) metrics.maxResponseTime = timeMs;

  const statusGroup = `${Math.floor(res.statusCode / 100)}xx`;
  metrics.statusCodes[statusGroup] = (metrics.statusCodes[statusGroup] || 0) + 1;

  if (res.statusCode >= 500) metrics.errorCount++;
  if (res.statusCode >= 400) metrics.failedRequestCount++;

  const route = `${req.method} ${req.route?.path || req.path}`;
  if (!metrics.endpoints[route]) metrics.endpoints[route] = { count: 0, totalTime: 0, errors: 0 };
  metrics.endpoints[route].count++;
  metrics.endpoints[route].totalTime += timeMs;
  if (res.statusCode >= 500) metrics.endpoints[route].errors++;
};

export const getMetrics = async (pool) => {
  const now = Date.now();
  const uptime = (now - metrics.startTime) / 1000;

  const avgResponseTime = metrics.requestCount > 0
    ? (metrics.totalResponseTime / metrics.requestCount).toFixed(2)
    : 0;

  let dbStatus = 'unknown';
  let dbResponseTime = null;
  let activeUsers = 0;
  let activeSessions = 0;
  let dbSize = null;

  try {
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    dbResponseTime = Date.now() - dbStart;
    dbStatus = 'healthy';

    const users = await pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
    activeUsers = parseInt(users.rows[0].count) || 0;

    const sessions = await pool.query('SELECT COUNT(*) FROM refresh_tokens WHERE expires_at > NOW()');
    activeSessions = parseInt(sessions.rows[0].count) || 0;

    const size = await pool.query(`
      SELECT pg_database_size(current_database()) / (1024*1024) as size_mb
    `);
    dbSize = parseInt(size.rows[0].size_mb) || null;
  } catch {
    dbStatus = 'unhealthy';
  }

  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  const errorRate = metrics.requestCount > 0
    ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2)
    : 0;

  return {
    uptime: Math.floor(uptime),
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    requests: {
      total: metrics.requestCount,
      errors: metrics.errorCount,
      failed: metrics.failedRequestCount,
      errorRate: `${errorRate}%`,
    },
    responseTime: {
      avg: `${avgResponseTime}ms`,
      min: metrics.minResponseTime === Infinity ? 0 : `${metrics.minResponseTime}ms`,
      max: `${metrics.maxResponseTime}ms`,
    },
    statusCodes: metrics.statusCodes,
    database: {
      status: dbStatus,
      responseTime: dbResponseTime ? `${dbResponseTime}ms` : null,
      activeUsers,
      activeSessions,
      sizeMb: dbSize,
    },
    system: {
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      },
      cpu: {
        user: `${Math.round(cpuUsage.user / 1000)}ms`,
        system: `${Math.round(cpuUsage.system / 1000)}ms`,
      },
    },
  };
};

export const resetMetrics = () => {
  metrics.requestCount = 0;
  metrics.errorCount = 0;
  metrics.failedRequestCount = 0;
  metrics.totalResponseTime = 0;
  metrics.minResponseTime = Infinity;
  metrics.maxResponseTime = 0;
  metrics.statusCodes = {};
  metrics.endpoints = {};
};
