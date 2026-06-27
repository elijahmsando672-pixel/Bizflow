import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { auditLogger } from '../middleware/security.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', auditLogger('auth.register'), authController.register);
router.post('/login', auditLogger('auth.login'), authController.login);
router.get('/me', authenticate, auditLogger('auth.me'), authController.me);
router.post('/logout', auditLogger('auth.logout'), authController.logout);
router.post('/forgot-password', auditLogger('auth.forgot-password'), authController.forgotPassword);
router.post('/reset-password', auditLogger('auth.reset-password'), authController.resetPassword);
router.post('/send-otp', auditLogger('auth.send-otp'), authController.sendOTP);
router.post('/verify-otp-login', auditLogger('auth.verify-otp-login'), authController.verifyOTPLogin);
router.post('/verify-otp-reset', auditLogger('auth.verify-otp-reset'), authController.verifyOTPReset);
router.post('/refresh-token', auditLogger('auth.refresh-token'), authController.refreshToken);
router.get('/csrf-token', authController.csrfToken);
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default router;
