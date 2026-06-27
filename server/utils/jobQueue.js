const CONCURRENCY = parseInt(process.env.JOB_CONCURRENCY || '3', 10);

const queue = [];
const active = new Set();
let drained = null;

export const JOB_STATUS = { PENDING: 'pending', RUNNING: 'running', COMPLETED: 'completed', FAILED: 'failed' };

class Job {
  constructor(name, data, handler) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.data = data;
    this.handler = handler;
    this.status = JOB_STATUS.PENDING;
    this.result = null;
    this.error = null;
    this.createdAt = new Date();
    this.startedAt = null;
    this.completedAt = null;
    this.attempts = 0;
    this.maxAttempts = 3;
  }
}

import crypto from 'crypto';

export const addJob = (name, data, handler, options = {}) => {
  const job = new Job(name, data, handler);
  if (options.maxAttempts) job.maxAttempts = options.maxAttempts;
  if (options.delay) {
    setTimeout(() => { queue.push(job); processQueue(); }, options.delay);
  } else {
    queue.push(job);
  }
  processQueue();
  return job;
};

export const addJobBatch = (jobs) => {
  for (const { name, data, handler, options } of jobs) {
    const job = new Job(name, data, handler);
    if (options?.maxAttempts) job.maxAttempts = options.maxAttempts;
    queue.push(job);
  }
  processQueue();
};

const processQueue = () => {
  if (active.size >= CONCURRENCY || queue.length === 0) return;

  const job = queue.shift();
  active.add(job);
  job.status = JOB_STATUS.RUNNING;
  job.startedAt = new Date();
  job.attempts++;

  Promise.resolve()
    .then(() => job.handler(job.data))
    .then((result) => {
      job.status = JOB_STATUS.COMPLETED;
      job.result = result;
      job.completedAt = new Date();
    })
    .catch(async (err) => {
      job.error = err.message;
      if (job.attempts < job.maxAttempts) {
        const delay = Math.min(5000 * Math.pow(2, job.attempts - 1), 60000);
        setTimeout(() => { queue.unshift(job); processQueue(); }, delay);
      } else {
        job.status = JOB_STATUS.FAILED;
        job.completedAt = new Date();
        console.error(`Job ${job.name} failed after ${job.attempts} attempts:`, err.message);
      }
    })
    .finally(() => {
      active.delete(job);
      if (queue.length === 0 && active.size === 0 && drained) drained();
      processQueue();
    });
};

export const getQueueStats = () => ({
  pending: queue.length,
  active: active.size,
  totalProcessed: 0,
});

export const onDrained = (fn) => { drained = fn; };

const REPEATABLE_JOBS = new Map();

export const addRepeatableJob = (name, data, handler, cronMs) => {
  if (REPEATABLE_JOBS.has(name)) return;
  const run = () => {
    addJob(name, { ...data, _scheduled: true }, handler);
  };
  run();
  const interval = setInterval(run, cronMs);
  REPEATABLE_JOBS.set(name, interval);
};

export const cancelRepeatableJob = (name) => {
  const interval = REPEATABLE_JOBS.get(name);
  if (interval) { clearInterval(interval); REPEATABLE_JOBS.delete(name); }
};
