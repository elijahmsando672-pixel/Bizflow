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

// ── Email Verification ──
router.post('/verify-email', auditLogger('auth.verify-email'), authController.verifyEmail);
router.post('/resend-verification', auditLogger('auth.resend-verification'), authController.resendVerification);

// ── 2FA / TOTP (authenticated) ──
router.post('/totp/setup', authenticate, auditLogger('auth.totp-setup'), authController.setupTOTP);
router.post('/totp/verify-setup', authenticate, auditLogger('auth.totp-verify-setup'), authController.verifyTOTPSetup);
router.post('/totp/disable', authenticate, auditLogger('auth.totp-disable'), authController.disableTOTP);

// ── Device Management (authenticated) ──
router.get('/devices', authenticate, auditLogger('auth.devices'), authController.getDevices);
router.delete('/devices/:id', authenticate, auditLogger('auth.revoke-device'), authController.revokeDevice);

// ── IP Whitelist (authenticated) ──
router.get('/ip-whitelist', authenticate, auditLogger('auth.ip-whitelist'), authController.getIpWhitelist);
router.post('/ip-whitelist', authenticate, auditLogger('auth.add-ip-whitelist'), authController.addIpWhitelist);
router.delete('/ip-whitelist/:id', authenticate, auditLogger('auth.remove-ip-whitelist'), authController.removeIpWhitelist);

export default router;
