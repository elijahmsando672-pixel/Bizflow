import { query } from '../config/db.js';

export const SUBSCRIPTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    device_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_business_endpoint
    ON push_subscriptions(business_id, endpoint);
`;

export const saveSubscription = async ({ userId, businessId, subscription, deviceName }) => {
  await query(
    `INSERT INTO push_subscriptions (user_id, business_id, endpoint, p256dh_key, auth_key, device_name)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (business_id, endpoint) DO UPDATE
       SET p256dh_key = EXCLUDED.p256dh_key,
           auth_key = EXCLUDED.auth_key,
           user_id = EXCLUDED.user_id,
           device_name = EXCLUDED.device_name`,
    [userId, businessId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, deviceName]
  );
};

/**
 * Removes one subscription, scoped to whoever is asking.
 *
 * The scope is a required argument rather than an optional filter because the
 * endpoint reaches this function straight from a request body. With no scope the
 * statement would delete by endpoint alone, and any authenticated member could
 * name another tenant's endpoint and switch off that business's notifications.
 * Returns the number of rows removed so a caller can tell a miss from a hit.
 */
export const removeSubscription = async (endpoint, { userId, businessId } = {}) => {
  if (!userId && !businessId) {
    throw new Error('removeSubscription requires a userId or businessId scope');
  }
  const r = await query(
    `DELETE FROM push_subscriptions
     WHERE endpoint = $1 AND business_id = $2 AND ($3::uuid IS NULL OR user_id = $3::uuid)`,
    [endpoint, businessId ?? null, userId ?? null]
  );
  return r.rowCount;
};

export const getUserSubscriptions = async (userId) => {
  /* tenant-exempt: keyed by the globally unique user id passed in by the caller, not by anything a request can name */
  const r = await query(
    'SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = $1',
    [userId]
  );
  return r.rows;
};

export const getBusinessSubscriptions = async (businessId) => {
  const r = await query(
    'SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE business_id = $1',
    [businessId]
  );
  return r.rows;
};

const webpush = {
  sendNotification: async (subscription, payload, scope) => {
    const { setVapidDetails, sendNotification } = await import('web-push');
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      console.warn('VAPID keys not configured. Install web-push and set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY');
      return;
    }
    setVapidDetails('mailto:security@bizflow.co.ke', publicKey, privateKey);
    try {
      await sendNotification(subscription, JSON.stringify(payload));
    } catch (err) {
      if (err.statusCode === 410) {
        // The endpoint is gone at the push service. Prune it, but keep the same
        // scope the send was made under so the delete cannot reach another tenant.
        await removeSubscription(subscription.endpoint, scope).catch(() => {});
      }
      console.error('Push send failed:', err.message);
    }
  },
};

export const sendPushNotification = async (userId, title, body, data = {}) => {
  const subs = await getUserSubscriptions(userId);
  for (const sub of subs) {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
      { title, body, data, icon: '/favicon.ico', badge: '/badge.png' },
      { userId }
    );
  }
};

export const sendBusinessPushNotification = async (businessId, title, body, data = {}) => {
  const subs = await getBusinessSubscriptions(businessId);
  for (const sub of subs) {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
      { title, body, data, icon: '/favicon.ico', badge: '/badge.png' },
      { businessId }
    );
  }
};
