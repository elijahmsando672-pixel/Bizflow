import express from 'express';
import * as saleService from '../services/saleService.js';
import { sendError } from '../utils/sendError.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const sales = await saleService.getSales(req.business_id, status);
    res.json(sales);
  } catch (err) { next(err); }
});

router.get('/receipts', async (req, res, next) => {
  try {
    const receipts = await saleService.getAllReceipts(req.business_id);
    res.json(receipts);
  } catch (err) { next(err); }
});

router.get('/:saleId/receipt', async (req, res, next) => {
  try {
    const { saleId } = req.params;
    let receipt = await saleService.getReceipt(req.business_id, saleId);

    if (!receipt) {
      const sale = await saleService.getSaleById(req.business_id, saleId);
      if (!sale) return sendError(res, 404, 'Sale not found');
      if (sale.status !== 'paid') return sendError(res, 400, 'Receipt only available for paid sales');

      receipt = await saleService.generateReceipt(req.business_id, saleId);
      return res.status(201).json(receipt);
    }

    res.json(receipt);
  } catch (err) { next(err); }
});

router.get('/:saleId/receipt/html', async (req, res, next) => {
  try {
    const { saleId } = req.params;
    let receipt = await saleService.getReceipt(req.business_id, saleId);

    if (!receipt) {
      const sale = await saleService.getSaleById(req.business_id, saleId);
      if (!sale) return sendError(res, 404, 'Sale not found');
      if (sale.status !== 'paid') return sendError(res, 400, 'Receipt only available for paid sales');

      receipt = await saleService.generateReceipt(req.business_id, saleId);
      if (!receipt) return sendError(res, 500, 'Failed to generate receipt');
    }

    res.setHeader('Content-Type', 'text/html');
    res.send(receipt.receipt_html);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const sale = await saleService.getSaleById(req.business_id, req.params.id);
    if (!sale) return sendError(res, 404, 'Not found');
    res.json(sale);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const sale = await saleService.createSale(req.business_id, req.user.id, req.body);
    res.status(201).json(sale);
  } catch (err) {
    if (err.statusCode === 400) return sendError(res, 400, err.message);
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const sale = await saleService.updateSale(req.business_id, req.params.id, req.body);
    res.json(sale);
  } catch (err) {
    if (err.statusCode === 400) return sendError(res, 400, err.message);
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await saleService.deleteSale(req.business_id, req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    if (err.statusCode === 404) return sendError(res, 404, 'Not found');
    next(err);
  }
});

export default router;
