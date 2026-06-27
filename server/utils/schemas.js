import Joi from 'joi';

const uuid = Joi.string().uuid();
const email = Joi.string().email().max(255);
const phone = Joi.string().max(50);
const url = Joi.string().uri().max(500);

export const customerSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  email: email.allow('', null),
  phone: phone.allow('', null),
  address: Joi.string().allow('', null),
  company: Joi.string().max(255).allow('', null),
  notes: Joi.string().allow('', null),
  credit_limit: Joi.number().min(0).default(0),
});

export const customerUpdateSchema = customerSchema.fork(['name'], (s) => s.optional());

export const productSchema = Joi.object({
  sku: Joi.string().max(100).allow('', null),
  barcode: Joi.string().max(100).allow('', null),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('', null),
  category_id: uuid.allow(null),
  unit: Joi.string().max(20).default('piece'),
  cost_price: Joi.number().min(0).default(0),
  selling_price: Joi.number().min(0).default(0),
  stock_qty: Joi.number().integer().min(0).default(0),
  reorder_level: Joi.number().integer().min(0).default(10),
  is_active: Joi.boolean().default(true),
  image_url: url.allow('', null),
});

export const productUpdateSchema = productSchema.fork(Object.keys(productSchema.describe().keys), (s) => s.optional());

export const saleSchema = Joi.object({
  customer_id: uuid.allow(null),
  sale_date: Joi.date().default(() => new Date()),
  due_date: Joi.date().allow(null),
  subtotal: Joi.number().min(0).default(0),
  tax_amount: Joi.number().min(0).default(0),
  discount_amount: Joi.number().min(0).default(0),
  total: Joi.number().min(0).required(),
  amount_paid: Joi.number().min(0).default(0),
  notes: Joi.string().allow('', null),
  items: Joi.array().items(Joi.object({
    product_id: uuid.allow(null),
    product_name: Joi.string().max(255).required(),
    qty: Joi.number().integer().min(1).required(),
    unit_price: Joi.number().min(0).required(),
    discount: Joi.number().min(0).default(0),
    total: Joi.number().min(0).required(),
  })).min(1).required(),
});

export const invoiceSchema = Joi.object({
  customer_id: uuid.allow(null),
  invoice_date: Joi.date().default(() => new Date()),
  due_date: Joi.date().allow(null),
  subtotal: Joi.number().min(0).default(0),
  discount_amount: Joi.number().min(0).default(0),
  total: Joi.number().min(0).required(),
  amount_paid: Joi.number().min(0).default(0),
  notes: Joi.string().allow('', null),
  items: Joi.array().items(Joi.object({
    product_id: uuid.allow(null),
    product_name: Joi.string().max(255).required(),
    qty: Joi.number().integer().min(1).required(),
    unit_price: Joi.number().min(0).required(),
    discount: Joi.number().min(0).default(0),
    total: Joi.number().min(0).required(),
  })).min(1).required(),
});

export const expenseSchema = Joi.object({
  category_id: uuid.allow(null),
  description: Joi.string().max(255).required(),
  amount: Joi.number().min(0).required(),
  date: Joi.date().default(() => new Date()),
  vendor: Joi.string().max(255).allow('', null),
  reference: Joi.string().max(100).allow('', null),
  notes: Joi.string().allow('', null),
});

export const expenseUpdateSchema = expenseSchema.fork(['description', 'amount'], (s) => s.optional());

export const employeeSchema = Joi.object({
  user_id: uuid.allow(null),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  email: email.allow('', null),
  phone: phone.allow('', null),
  position: Joi.string().max(100).allow('', null),
  department: Joi.string().max(100).allow('', null),
  hire_date: Joi.date().required(),
  status: Joi.string().valid('active', 'inactive', 'terminated').default('active'),
  salary: Joi.number().min(0).default(0),
  salary_type: Joi.string().valid('monthly', 'hourly', 'weekly').default('monthly'),
  bank_name: Joi.string().max(100).allow('', null),
  bank_account: Joi.string().max(50).allow('', null),
  id_number: Joi.string().max(50).allow('', null),
  address: Joi.string().allow('', null),
  emergency_contact_name: Joi.string().max(100).allow('', null),
  emergency_contact_phone: phone.allow('', null),
  notes: Joi.string().allow('', null),
});

export const debtorSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  email: email.allow('', null),
  phone: phone.allow('', null),
  address: Joi.string().allow('', null),
  opening_balance: Joi.number().min(0).default(0),
  notes: Joi.string().allow('', null),
});

export const creditorSchema = debtorSchema;

export const shopSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  location: Joi.string().allow('', null),
  phone: phone.allow('', null),
  email: email.allow('', null),
  status: Joi.string().valid('active', 'inactive').default('active'),
  manager_name: Joi.string().max(255).allow('', null),
  opening_time: Joi.string().default('08:00'),
  closing_time: Joi.string().default('18:00'),
});

export const projectSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'completed', 'on_hold', 'cancelled').default('active'),
  start_date: Joi.date().allow(null),
  end_date: Joi.date().allow(null),
  budget: Joi.number().min(0).allow(null),
  customer_id: uuid.allow(null),
  assigned_to: uuid.allow(null),
});

export const vendorSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  email: email.allow('', null),
  phone: phone.allow('', null),
  address: Joi.string().allow('', null),
  contact_person: Joi.string().max(100).allow('', null),
  payment_terms: Joi.string().max(50).allow('', null),
  rating: Joi.number().min(0).max(5).allow(null),
  notes: Joi.string().allow('', null),
});

export const purchaseOrderSchema = Joi.object({
  vendor_id: uuid.allow(null),
  status: Joi.string().valid('draft', 'pending', 'approved', 'shipped', 'received', 'cancelled').default('draft'),
  order_date: Joi.date().default(() => new Date()),
  expected_delivery: Joi.date().allow(null),
  subtotal: Joi.number().min(0).default(0),
  tax_amount: Joi.number().min(0).default(0),
  total: Joi.number().min(0).default(0),
  notes: Joi.string().allow('', null),
  items: Joi.array().items(Joi.object({
    product_id: uuid.allow(null),
    product_name: Joi.string().max(255).required(),
    qty: Joi.number().integer().min(1).required(),
    unit_price: Joi.number().min(0).required(),
    total: Joi.number().min(0).required(),
  })).min(1).required(),
});

export const aiInsightSchema = Joi.object({
  insight_type: Joi.string().max(50).required(),
  content: Joi.object().required(),
  summary: Joi.string().allow('', null),
});

export const categorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().allow('', null),
  parent_id: uuid.allow(null),
});
