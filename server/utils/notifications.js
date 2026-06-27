import { query } from '../config/db.js';

export const sendNotification = async ({
  businessId,
  userId,
  title,
  message,
  type = 'info',
  link = null,
}) => {
  try {
    await query(
      `INSERT INTO notifications (business_id, user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [businessId, userId, title, message, type, link]
    );
  } catch (err) {
    console.error('Notification failed:', err);
  }
};

export const notifyBusiness = async (businessId, title, message, type = 'info', link = null) => {
  try {
    const users = await query(
      'SELECT id FROM users WHERE business_id = $1 AND is_active = true',
      [businessId]
    );
    for (const user of users.rows) {
      await sendNotification({ businessId, userId: user.id, title, message, type, link });
    }
  } catch (err) {
    console.error('Business notification failed:', err);
  }
};

export const notifyAdmins = async (businessId, title, message, type = 'info', link = null) => {
  try {
    const admins = await query(
      "SELECT id FROM users WHERE business_id = $1 AND role IN ('owner', 'admin')",
      [businessId]
    );
    for (const admin of admins.rows) {
      await sendNotification({ businessId, userId: admin.id, title, message, type, link });
    }
  } catch (err) {
    console.error('Admin notification failed:', err);
  }
};

export const sendWebhook = async (businessId, event, payload) => {
  try {
    const hooks = await query(
      'SELECT url, secret FROM webhooks WHERE business_id = $1 AND is_active = true AND event = $2',
      [businessId, event]
    );
    for (const hook of hooks.rows) {
      const signature = hook.secret
        ? require('crypto').createHmac('sha256', hook.secret).update(JSON.stringify(payload)).digest('hex')
        : null;
      const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
      const headers = { 'Content-Type': 'application/json', 'User-Agent': 'BizFlow-Webhook/1.0' };
      if (signature) headers['X-Webhook-Signature'] = signature;

      fetch(hook.url, { method: 'POST', headers, body })
        .catch(err => console.error(`Webhook delivery failed to ${hook.url}:`, err.message));
    }
  } catch (err) {
    console.error('Webhook dispatch failed:', err);
  }
};
