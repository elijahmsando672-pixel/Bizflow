import express from 'express';
import * as expenseController from '../controllers/expenseController.js';

const router = express.Router();

router.get('/categories/list', expenseController.getCategories);
router.post('/categories', expenseController.createCategory);
router.get('/', expenseController.getAll);
router.post('/', expenseController.create);
router.get('/:id', expenseController.getById);
router.put('/:id', expenseController.update);
router.delete('/:id', expenseController.remove);

export default router;
