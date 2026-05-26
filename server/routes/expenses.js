import express from 'express';
import * as expenseController from '../controllers/expenseController.js';

const router = express.Router();

router.get('/', expenseController.getAll);
router.get('/:id', expenseController.getById);
router.post('/', expenseController.create);
router.put('/:id', expenseController.update);
router.delete('/:id', expenseController.remove);
router.get('/categories/list', expenseController.getCategories);
router.post('/categories', expenseController.createCategory);

export default router;
