import express from 'express';
import { auditLogger } from '../middleware/security.js';
import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();

router.get('/mpesa/agents', auditLogger('payments.mpesa.agents.list'), paymentController.getAgents);
router.post('/mpesa/agents', auditLogger('payments.mpesa.agents.create'), paymentController.createAgent);
router.put('/mpesa/agents/:id', auditLogger('payments.mpesa.agents.update'), paymentController.updateAgent);
router.delete('/mpesa/agents/:id', auditLogger('payments.mpesa.agents.delete'), paymentController.deleteAgent);
router.get('/mpesa/transactions', auditLogger('payments.mpesa.transactions'), paymentController.getTransactions);
router.get('/mpesa/reports', auditLogger('payments.mpesa.reports'), paymentController.getReports);

export default router;
