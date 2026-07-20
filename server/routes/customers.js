import express from 'express';
import Joi from 'joi';
import * as customerController from '../controllers/customerController.js';
import { sendError } from '../utils/sendError.js';

const router = express.Router();

const customerSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  company: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
  credit_limit: Joi.number().min(0).allow(0, null),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return sendError(res, 400, error.details.map(d => d.message).join(', '));
  req.body = value;
  next();
};

router.get('/', customerController.getAll);
router.post('/', validate(customerSchema), customerController.create);
router.get('/:id', customerController.getById);
router.put('/:id', validate(customerSchema), customerController.update);
router.delete('/:id', customerController.remove);

export default router;
