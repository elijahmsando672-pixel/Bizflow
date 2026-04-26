import { z } from 'zod';

// Auth Validators
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Customer Validators
export const customerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
  credit_limit: z.coerce.number().min(0, 'Credit limit must be positive').optional().or(z.literal('')),
});

// Product Validators
export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().optional(),
  unit: z.string().default('piece'),
  cost_price: z.coerce.number().min(0, 'Cost price must be positive'),
  selling_price: z.coerce.number().min(0, 'Selling price must be positive'),
  stock_qty: z.coerce.number().min(0, 'Stock quantity must be positive').default(0),
  reorder_level: z.coerce.number().min(0, 'Reorder level must be positive').default(10),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

// Sale/Invoice Item Validators
export const saleItemSchema = z.object({
  product_id: z.string().optional(),
  product_name: z.string().min(1, 'Product name is required'),
  qty: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.coerce.number().min(0, 'Unit price must be positive'),
  discount: z.coerce.number().min(0, 'Discount must be positive').optional().or(z.literal('')),
});

// Sale Validators
export const saleSchema = z.object({
  customer_id: z.string().optional(),
  sale_date: z.string().or(z.date()).optional(),
  due_date: z.string().or(z.date()).optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  discount_amount: z.coerce.number().min(0, 'Discount must be positive').optional().or(z.literal('')),
});

// Invoice Validators
export const invoiceSchema = z.object({
  customer_id: z.string().optional(),
  invoice_date: z.string().or(z.date()).optional(),
  due_date: z.string().or(z.date()).optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  discount_amount: z.coerce.number().min(0, 'Discount must be positive').optional().or(z.literal('')),
});

// Expense Validators
export const expenseSchema = z.object({
  category_id: z.string().optional(),
  description: z.string().min(2, 'Description is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string().or(z.date()).optional(),
  vendor: z.string().optional(),
  reference: z.string().optional(),
  is_receipt_attached: z.boolean().optional(),
  notes: z.string().optional(),
});

// Category Validators
export const categorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  description: z.string().optional(),
  parent_id: z.string().optional(),
});

export const expenseCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

// Type exports for use in components
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type SaleFormData = z.infer<typeof saleSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type ExpenseCategoryFormData = z.infer<typeof expenseCategorySchema>;
