import { Router } from 'express';
import { saveSubscription, removeSubscription } from '../utils/pushNotifications.js';
import { AppError } from '../utils/AppError.js';

const router = Router();

router.post('/subscribe', async (req, res, next) => {
  try {
    const { endpoint, keys, device_name } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      throw new AppError('Invalid subscription object', 400);
    }
    await saveSubscription({
      userId: req.user.id,
      businessId: req.business_id,
      subscription: { endpoint, keys },
      deviceName: device_name,
    });
    res.status(201).json({ success: true, message: 'Subscribed' });
  } catch (err) { next(err); }
});

router.post('/unsubscribe', async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) throw new AppError('endpoint is required', 400);
    await removeSubscription(endpoint);
    res.json({ success: true, message: 'Unsubscribed' });
  } catch (err) { next(err); }
});

export default router;
