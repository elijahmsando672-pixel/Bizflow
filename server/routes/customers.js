import express from 'express';
import * as customerController from '../controllers/customerController.js';

const router = express.Router();

router.get('/', customerController.getAll);
router.post('/', customerController.create);
router.get('/:id', customerController.getById);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.remove);

export default router;
