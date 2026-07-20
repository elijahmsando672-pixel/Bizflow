import express from 'express';
import * as invoiceService from '../services/invoiceService.js';
import { sendError } from '../utils/sendError.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const invoices = await invoiceService.getInvoices(req.business_id, status);
    res.json(invoices);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.business_id, req.params.id);
    if (!invoice) return sendError(res, 404, 'Invoice not found');
    res.json(invoice);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const invoice = await invoiceService.createInvoice(req.business_id, req.user.id, req.body);
    res.status(201).json(invoice);
  } catch (err) {
    if (err.statusCode === 400) return sendError(res, 400, err.message);
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const invoice = await invoiceService.updateInvoice(req.business_id, req.params.id, req.body);
    res.json(invoice);
  } catch (err) {
    if (err.statusCode === 404) return sendError(res, 404, 'Not found');
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await invoiceService.deleteInvoice(req.business_id, req.params.id);
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    if (err.statusCode === 404) return sendError(res, 404, 'Not found');
    next(err);
  }
});

export default router;
