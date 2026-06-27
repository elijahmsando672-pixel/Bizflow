import crypto from 'crypto';

export const verifyWebhookSignature = (payload, signature, secret) => {
  if (!signature || !secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
};

export const verifyWebhookTimestamp = (timestamp, maxAgeMs = 300000) => {
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;
  return Math.abs(Date.now() - ts) <= maxAgeMs;
};
