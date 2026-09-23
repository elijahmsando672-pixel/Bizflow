import { query } from '../config/db.js';

export const SUBSCRIPTIONS_TABLE = `
IF OBJECT_ID(N'dbo.push_subscriptions', N'U') IS NULL
CREATE TABLE dbo.push_subscriptions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER REFERENCES dbo.users(id) ON DELETE CASCADE,
  business_id UNIQUEIDENTIFIER REFERENCES dbo.businesses(id) ON DELETE CASCADE,
  endpoint NVARCHAR(500) NOT NULL UNIQUE,
  p256dh_key NVARCHAR(500) NOT NULL,
  auth_key NVARCHAR(500) NOT NULL,
  device_name NVARCHAR(255),
  created_at DATETIME2 DEFAULT GETDATE()
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_push_subs_user' AND object_id = OBJECT_ID(N'dbo.push_subscriptions'))
CREATE INDEX idx_push_subs_user ON dbo.push_subscriptions(user_id);
`;

export const saveSubscription = async ({ userId, businessId, subscription, deviceName }) => {
  await query(
    `MERGE push_subscriptions AS t
     USING (SELECT @p3 AS endpoint) AS s ON t.endpoint = s.endpoint
     WHEN MATCHED THEN UPDATE SET p256dh_key = @p4, auth_key = @p5
     WHEN NOT MATCHED THEN INSERT (user_id, business_id, endpoint, p256dh_key, auth_key, device_name)
       VALUES (@p1, @p2, @p3, @p4, @p5, @p6);`,
    [userId, businessId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, deviceName]
  );
};

export const removeSubscription = async (endpoint) => {
  await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
};

export const getUserSubscriptions = async (userId) => {
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
  sendNotification: async (subscription, payload) => {
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
        await removeSubscription(subscription.endpoint);
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
      { title, body, data, icon: '/favicon.ico', badge: '/badge.png' }
    );
  }
};

export const sendBusinessPushNotification = async (businessId, title, body, data = {}) => {
  const subs = await getBusinessSubscriptions(businessId);
  for (const sub of subs) {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
      { title, body, data, icon: '/favicon.ico', badge: '/badge.png' }
    );
  }
};
