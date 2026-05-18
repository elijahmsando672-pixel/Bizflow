import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authenticate } from '../middleware/auth.js';

export const app = express();
app.use(cors());
app.use(express.json());

import authRoutes from '../routes/auth.js';
import customerRoutes from '../routes/customers.js';
import productRoutes from '../routes/products.js';
import invoiceRoutes from '../routes/invoices.js';
import expenseRoutes from '../routes/expenses.js';
import dashboardRoutes from '../routes/dashboard.js';

app.use('/api/auth', authRoutes);
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/products', authenticate, productRoutes);
app.use('/api/invoices', authenticate, invoiceRoutes);
app.use('/api/expenses', authenticate, expenseRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));