import express from 'express';
import * as productController from '../controllers/productController.js';

const router = express.Router();

router.get('/categories', productController.getCategories);
router.post('/categories', productController.createCategory);
router.get('/', productController.getAll);
router.post('/', productController.create);
router.get('/:id', productController.getById);
router.put('/:id', productController.update);
router.delete('/:id', productController.remove);
router.get('/:id/stock-history', productController.getStockHistory);

export default router;
