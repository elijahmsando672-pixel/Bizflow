import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bizflow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const query = async (text, params) => pool.query(text, params);

let BUSINESS_ID, USER_ID;
const USER_NAME = 'Elijah';

const now = new Date();
const d = (daysAgo) => {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

async function seedDemo() {
  try {
    console.log('🌱 Seeding demo data...');

    // Bootstrap: create business and admin user if they don't exist
    const existingUser = await query(`SELECT id FROM users WHERE email = 'elijah@bizflow.com'`);
    if (existingUser.rows.length === 0) {
      const bizResult = await query(
        `INSERT INTO businesses (name, email, status) VALUES ('BizFlow Demo', 'admin@bizflow.com', 'active') RETURNING id`
      );
      BUSINESS_ID = bizResult.rows[0].id;
      const { hashPassword } = await import('../utils/password.js');
      const hashedPassword = await hashPassword('test123');
      const userResult = await query(
        `INSERT INTO users (business_id, name, email, password, role) VALUES ($1, 'Elijah', 'elijah@bizflow.com', $2, 'owner') RETURNING id`,
        [BUSINESS_ID, hashedPassword]
      );
      USER_ID = userResult.rows[0].id;
      console.log('✅ Created demo business and admin user');
    } else {
      const user = existingUser.rows[0];
      const bizResult = await query(`SELECT id FROM users WHERE id = $1`, [user.id]);
      USER_ID = user.id;
      const bizIdResult = await query(`SELECT business_id FROM users WHERE id = $1`, [user.id]);
      BUSINESS_ID = bizIdResult.rows[0].business_id;
    }

    // 1. Customers
    const customers = [
      { name: 'Acme Corp Kenya', email: 'info@acme.co.ke', phone: '+254711222333', company: 'Acme Corp', address: 'Westlands, Nairobi', credit_limit: 50000 },
      { name: 'Jane Muthoni', email: 'jane.m@gmail.com', phone: '+254722444555', company: '', address: 'Kilimani, Nairobi', credit_limit: 0 },
      { name: 'TechHub Solutions', email: 'sales@techhub.co.ke', phone: '+254733666777', company: 'TechHub', address: 'CBD, Nairobi', credit_limit: 100000 },
      { name: 'David Ochieng', email: 'david.o@yahoo.com', phone: '+254744888999', company: '', address: 'Mombasa', credit_limit: 0 },
      { name: 'Greenfield Agriculture Ltd', email: 'orders@greenfield.co.ke', phone: '+254755111222', company: 'Greenfield', address: 'Nakuru', credit_limit: 75000 },
      { name: 'Safaricom Business', email: 'b2b@safaricom.co.ke', phone: '+254700000000', company: 'Safaricom', address: 'Safaricom House, Nairobi', credit_limit: 200000 },
      { name: 'Nairobi Hospital', email: 'procurement@nairobihospital.org', phone: '+254702200200', company: 'Nairobi Hospital', address: 'Argwings Kodhek Rd', credit_limit: 150000 },
      { name: 'Fatuma Hassan', email: 'fatuma.h@outlook.com', phone: '+254766333444', company: '', address: 'Kisumu', credit_limit: 0 },
    ];

    const customerIds = {};
    for (const c of customers) {
      const r = await query(
        `INSERT INTO customers (business_id, name, email, phone, company, address, credit_limit, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [BUSINESS_ID, c.name, c.email, c.phone, c.company, c.address, c.credit_limit, d(Math.floor(Math.random() * 60))]
      );
      customerIds[c.name] = r.rows[0].id;
    }
    console.log(`✅ ${customers.length} customers`);

    // 2. Product Categories first
    const categories = ['Electronics', 'Printers', 'Accessories', 'Furniture', 'Networking', 'Software', 'Power'];
    const categoryIds = {};
    for (const cat of categories) {
      const r = await query(
        `INSERT INTO categories (business_id, name, description) VALUES ($1,$2,$3) RETURNING id`,
        [BUSINESS_ID, cat, `${cat} products`]
      );
      categoryIds[cat] = r.rows[0].id;
    }
    console.log(`✅ ${categories.length} categories`);

    // Products
    const products = [
      { name: 'MacBook Pro 14"', sku: 'LAP-MBP-14', category: 'Electronics', cost_price: 180000, selling_price: 220000, stock_qty: 12, reorder_level: 3 },
      { name: 'Dell OptiPlex 7090', sku: 'DTL-OP-7090', category: 'Electronics', cost_price: 65000, selling_price: 85000, stock_qty: 25, reorder_level: 5 },
      { name: 'HP LaserJet Pro', sku: 'PRT-HP-LJ', category: 'Printers', cost_price: 28000, selling_price: 35000, stock_qty: 8, reorder_level: 2 },
      { name: 'Logitech MX Master 3', sku: 'ACC-LG-MX3', category: 'Accessories', cost_price: 8500, selling_price: 12000, stock_qty: 50, reorder_level: 10 },
      { name: 'Standing Desk - Electric', sku: 'FRN-SD-ELC', category: 'Furniture', cost_price: 35000, selling_price: 48000, stock_qty: 6, reorder_level: 2 },
      { name: 'Cat6 Ethernet Cable (100m)', sku: 'CBL-CAT6-100', category: 'Networking', cost_price: 3500, selling_price: 5000, stock_qty: 40, reorder_level: 10 },
      { name: 'Samsung 27" Monitor', sku: 'MON-SAM-27', category: 'Electronics', cost_price: 22000, selling_price: 28000, stock_qty: 15, reorder_level: 5 },
      { name: 'Ergonomic Office Chair', sku: 'FRN-CHR-ERG', category: 'Furniture', cost_price: 18000, selling_price: 25000, stock_qty: 10, reorder_level: 3 },
      { name: 'Microsoft 365 Business (1yr)', sku: 'LIC-MS365-B', category: 'Software', cost_price: 10000, selling_price: 14000, stock_qty: 100, reorder_level: 20 },
      { name: 'Cisco Switch 24-Port', sku: 'NET-CS-24P', category: 'Networking', cost_price: 45000, selling_price: 58000, stock_qty: 4, reorder_level: 2 },
      { name: 'APC UPS 1500VA', sku: 'PWR-APC-1500', category: 'Power', cost_price: 15000, selling_price: 20000, stock_qty: 2, reorder_level: 3 },
      { name: 'Webcam HD 1080p', sku: 'ACC-WC-1080', category: 'Accessories', cost_price: 4500, selling_price: 7000, stock_qty: 30, reorder_level: 8 },
    ];

    const productIds = {};
    for (const p of products) {
      const catId = categoryIds[p.category];
      const r = await query(
        `INSERT INTO products (business_id, sku, name, category_id, cost_price, selling_price, stock_qty, reorder_level, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [BUSINESS_ID, p.sku, p.name, catId, p.cost_price, p.selling_price, p.stock_qty, p.reorder_level, d(Math.floor(Math.random() * 90))]
      );
      productIds[p.sku] = r.rows[0].id;
    }
    console.log(`✅ ${products.length} products`);

    // 3. Expense Categories
    const expCats = ['Office Supplies', 'Utilities', 'Transport', 'Marketing', 'Software Subscriptions', 'Rent'];
    for (const cat of expCats) {
      const existing = await query(
        `SELECT id FROM expense_categories WHERE business_id = $1 AND name = $2 LIMIT 1`,
        [BUSINESS_ID, cat]
      );
      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO expense_categories (business_id, name, description) VALUES ($1,$2,$3)`,
          [BUSINESS_ID, cat, `Expenses for ${cat.toLowerCase()}`]
        );
      }
    }
    console.log(`✅ ${expCats.length} expense categories`);

    // 4. Expenses
    const expenses = [
      { description: 'Monthly internet - Safaricom Fibre', amount: 8500, category: 'Utilities', date: d(5) },
      { description: 'Facebook Ad Campaign - Q2', amount: 25000, category: 'Marketing', date: d(3) },
      { description: 'Printer Toner Cartridges (3x)', amount: 9000, category: 'Office Supplies', date: d(8) },
      { description: 'Uber client meetings - April', amount: 4500, category: 'Transport', date: d(2) },
      { description: 'Adobe Creative Cloud Annual', amount: 32000, category: 'Software Subscriptions', date: d(15) },
      { description: 'Office Rent - April', amount: 45000, category: 'Rent', date: d(1) },
      { description: 'Staff lunch catering', amount: 6000, category: 'Office Supplies', date: d(4) },
      { description: 'Google Workspace (10 users)', amount: 12000, category: 'Software Subscriptions', date: d(7) },
      { description: 'Courier deliveries', amount: 2500, category: 'Transport', date: d(6) },
      { description: 'Water dispenser refills', amount: 1500, category: 'Office Supplies', date: d(10) },
    ];

    for (const e of expenses) {
      await query(
        `INSERT INTO expenses (business_id, description, amount, date, created_by) VALUES ($1,$2,$3,$4,$5)`,
        [BUSINESS_ID, e.description, e.amount, d(Math.floor(Math.random() * 30)), USER_ID]
      );
    }
    console.log(`✅ ${expenses.length} expenses`);

    // 5. Sales/Invoices
    const salesData = [
      { customer: 'Acme Corp Kenya', items: [{ sku: 'LAP-MBP-14', qty: 2, price: 220000 }, { sku: 'ACC-LG-MX3', qty: 2, price: 12000 }], status: 'paid', date: d(10) },
      { customer: 'TechHub Solutions', items: [{ sku: 'DTL-OP-7090', qty: 5, price: 85000 }, { sku: 'MON-SAM-27', qty: 5, price: 28000 }], status: 'pending', date: d(5) },
      { customer: 'Safaricom Business', items: [{ sku: 'NET-CS-24P', qty: 3, price: 58000 }, { sku: 'CBL-CAT6-100', qty: 10, price: 5000 }], status: 'paid', date: d(15) },
      { customer: 'Nairobi Hospital', items: [{ sku: 'PRT-HP-LJ', qty: 4, price: 35000 }, { sku: 'FRN-SD-ELC', qty: 2, price: 48000 }], status: 'overdue', date: d(25) },
      { customer: 'Jane Muthoni', items: [{ sku: 'LIC-MS365-B', qty: 1, price: 14000 }], status: 'paid', date: d(3) },
      { customer: 'Greenfield Agriculture Ltd', items: [{ sku: 'FRN-CHR-ERG', qty: 5, price: 25000 }, { sku: 'FRN-SD-ELC', qty: 5, price: 48000 }], status: 'pending', date: d(2) },
      { customer: 'David Ochieng', items: [{ sku: 'ACC-WC-1080', qty: 3, price: 7000 }, { sku: 'MON-SAM-27', qty: 2, price: 28000 }], status: 'paid', date: d(8) },
      { customer: 'Fatuma Hassan', items: [{ sku: 'LAP-MBP-14', qty: 1, price: 220000 }, { sku: 'ACC-LG-MX3', qty: 1, price: 12000 }], status: 'draft', date: d(1) },
    ];

    let saleCounter = 1000;
    for (const s of salesData) {
      saleCounter++;
      const invNum = `INV-${saleCounter}`;
      const custId = customerIds[s.customer];
      const subtotal = s.items.reduce((sum, i) => sum + i.qty * i.price, 0);
      const tax = Math.round(subtotal * 0.16);
      const total = subtotal + tax;

      const sale = await query(
        `INSERT INTO sales (business_id, customer_id, invoice_number, status, sale_date, subtotal, tax_amount, total, amount_paid, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [BUSINESS_ID, custId, invNum, s.status, d(Math.floor(Math.random() * 30)), subtotal, tax, total, s.status === 'paid' ? total : 0, USER_ID]
      );
      const saleId = sale.rows[0].id;

      for (const item of s.items) {
        const prodId = productIds[item.sku];
        await query(
          `INSERT INTO sale_items (business_id, sale_id, product_id, product_name, qty, unit_price, total) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [BUSINESS_ID, saleId, prodId, item.sku, item.qty, item.price, item.qty * item.price]
        );
      }

      await query(
        `INSERT INTO invoices (business_id, customer_id, invoice_number, status, invoice_date, subtotal, discount_amount, total, amount_paid, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8,$9)`,
        [BUSINESS_ID, custId, invNum, s.status, d(Math.floor(Math.random() * 30)), subtotal, total, s.status === 'paid' ? total : 0, USER_ID]
      );
    }
    console.log(`✅ ${salesData.length} sales/invoices`);

    // 6. Leads
    const leads = [
      { first_name: 'Peter', last_name: 'Kamau', email: 'peter.k@zenith.co.ke', company: 'Zenith Holdings', source: 'referral', status: 'new', estimated_value: 150000 },
      { first_name: 'Amina', last_name: 'Ali', email: 'amina.a@global.com', company: 'Global Trading', source: 'website', status: 'contacted', estimated_value: 80000 },
      { first_name: 'Brian', last_name: 'Omondi', email: 'brian@startup.ke', company: 'Startup KE', source: 'linkedin', status: 'qualified', estimated_value: 250000 },
      { first_name: 'Grace', last_name: 'Wanjiku', email: 'grace@education.go.ke', company: 'Ministry of Education', source: 'cold_call', status: 'new', estimated_value: 500000 },
      { first_name: 'Samuel', last_name: 'Mutua', email: 'samuel@logistics.co.ke', company: 'FastTrack Logistics', source: 'trade_show', status: 'proposal', estimated_value: 120000 },
    ];

    const leadIds = {};
    for (const l of leads) {
      const r = await query(
        `INSERT INTO leads (business_id, first_name, last_name, email, company, source, status, estimated_value, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [BUSINESS_ID, l.first_name, l.last_name, l.email, l.company, l.source, l.status, l.estimated_value, USER_ID]
      );
      leadIds[l.first_name + l.last_name] = r.rows[0].id;
    }
    console.log(`✅ ${leads.length} leads`);

    // 7. Deal Stages
    const stages = [
      { name: 'Qualification', order_index: 0, win_probability: 10, color: '#6b7280' },
      { name: 'Proposal', order_index: 1, win_probability: 30, color: '#f59e0b' },
      { name: 'Negotiation', order_index: 2, win_probability: 60, color: '#3b82f6' },
      { name: 'Closed Won', order_index: 3, win_probability: 100, color: '#10b981' },
      { name: 'Closed Lost', order_index: 4, win_probability: 0, color: '#ef4444' },
    ];

    const stageIds = {};
    for (const s of stages) {
      const r = await query(
        `INSERT INTO deal_stages (business_id, name, order_index, win_probability, color) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [BUSINESS_ID, s.name, s.order_index, s.win_probability, s.color]
      );
      stageIds[s.name] = r.rows[0].id;
    }
    console.log(`✅ ${stages.length} deal stages`);

    // 8. Deals
    const deals = [
      { name: 'Zenith IT Infrastructure Upgrade', customer: 'Acme Corp Kenya', stage: 'Negotiation', value: 850000, priority: 'high', close_date: d(-15) },
      { name: 'Global Trading Workstation Setup', customer: 'TechHub Solutions', stage: 'Proposal', value: 320000, priority: 'medium', close_date: d(-5) },
      { name: 'Startup KE Office Setup', customer: '', stage: 'Qualification', value: 180000, priority: 'low', close_date: d(-30) },
      { name: 'Ministry Laptop Procurement', customer: '', stage: 'Negotiation', value: 2400000, priority: 'high', close_date: d(-20) },
      { name: 'FastTrack Fleet Tracking System', customer: 'Safaricom Business', stage: 'Closed Won', value: 560000, priority: 'high', close_date: d(-40) },
      { name: 'Hospital Network Equipment', customer: 'Nairobi Hospital', stage: 'Proposal', value: 1200000, priority: 'high', close_date: d(-10) },
      { name: 'University Lab Computers', customer: '', stage: 'Closed Won', value: 980000, priority: 'medium', close_date: d(-50) },
      { name: 'Retail POS System Bundle', customer: 'Jane Muthoni', stage: 'Closed Lost', value: 95000, priority: 'low', close_date: d(-35) },
    ];

    for (const deal of deals) {
      const stageId = stageIds[deal.stage];
      const custId = deal.customer ? customerIds[deal.customer] : null;
      const outcome = deal.stage === 'Closed Won' ? 'won' : deal.stage === 'Closed Lost' ? 'lost' : null;
      await query(
        `INSERT INTO deals (business_id, customer_id, name, stage_id, value, priority, expected_close_date, outcome, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [BUSINESS_ID, custId, deal.name, stageId, deal.value, deal.priority, deal.close_date, outcome, USER_ID]
      );
    }
    console.log(`✅ ${deals.length} deals`);

    // 9. Support Tickets
    const tickets = [
      { subject: 'MacBook Pro not charging', description: 'Customer reports charging issue with MacBook Pro purchased last month.', priority: 'high', status: 'in_progress', category: 'technical', customer: 'Jane Muthoni' },
      { subject: 'Invoice discrepancy', description: 'Total amount on invoice INV-1002 does not match quoted price.', priority: 'medium', status: 'open', category: 'billing', customer: 'Acme Corp Kenya' },
      { subject: 'Delivery delay inquiry', description: 'Order placed 2 weeks ago still not delivered to Mombasa.', priority: 'high', status: 'open', category: 'general', customer: 'David Ochieng' },
      { subject: 'Request for bulk pricing', description: 'Interested in purchasing 50+ units. Need discounted pricing.', priority: 'low', status: 'resolved', category: 'general', customer: 'Safaricom Business' },
      { subject: 'Software license activation issue', description: 'Microsoft 365 license key not activating on multiple devices.', priority: 'medium', status: 'in_progress', category: 'technical', customer: 'TechHub Solutions' },
      { subject: 'Return request - defective monitor', description: 'Samsung monitor has dead pixels. Requesting replacement.', priority: 'high', status: 'open', category: 'technical', customer: 'Fatuma Hassan' },
      { subject: 'Payment plan inquiry', description: 'Customer wants to pay for KES 480,000 order in 3 installments.', priority: 'medium', status: 'closed', category: 'billing', customer: 'Greenfield Agriculture Ltd' },
      { subject: 'Warranty claim - printer', description: 'HP LaserJet stopped working after 3 months. Under warranty.', priority: 'critical', status: 'in_progress', category: 'technical', customer: 'Nairobi Hospital' },
    ];

    const ticketIds = {};
    let tktCounter = 3000;
    for (const t of tickets) {
      tktCounter++;
      const custId = t.customer ? customerIds[t.customer] : null;
      const slaDeadline = new Date(now);
      slaDeadline.setHours(slaDeadline.getHours() + (t.priority === 'critical' ? 4 : t.priority === 'high' ? 12 : 48));

      const r = await query(
        `INSERT INTO support_tickets (business_id, customer_id, ticket_number, subject, description, priority, status, category, sla_deadline, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [BUSINESS_ID, custId, `TKT-${tktCounter}`, t.subject, t.description, t.priority, t.status, t.category, slaDeadline.toISOString(), USER_ID]
      );
      ticketIds[t.subject] = r.rows[0].id;
    }
    console.log(`✅ ${tickets.length} support tickets`);

    // 10. Ticket Replies
    const replies = [
      { ticket: 'MacBook Pro not charging', message: 'Hi Jane, sorry to hear about the issue. Could you try using a different power adapter if available?', is_internal: false },
      { ticket: 'MacBook Pro not charging', message: 'Tried another charger, same issue. The laptop only charges when positioned at a certain angle.', is_internal: false },
      { ticket: 'Invoice discrepancy', message: 'Checking the records now. The quoted price was KES 85,000 per unit for 2 units. The invoice shows KES 220,000 each.', is_internal: true },
      { ticket: 'Delivery delay inquiry', message: 'I understand the frustration. Let me check with our logistics partner and get back to you within 24 hours.', is_internal: false },
      { ticket: 'Software license activation issue', message: 'This usually happens when the same license key is used on more devices than the plan allows. How many devices are you trying to activate?', is_internal: false },
      { ticket: 'Warranty claim - printer', message: 'We need to send a technician to inspect the unit. Can we schedule for tomorrow morning?', is_internal: false },
    ];

    for (const reply of replies) {
      const ticketId = ticketIds[reply.ticket];
      if (ticketId) {
        await query(
          `INSERT INTO ticket_replies (business_id, ticket_id, message, is_internal, created_by) VALUES ($1,$2,$3,$4,$5)`,
          [BUSINESS_ID, ticketId, reply.message, reply.is_internal, USER_ID]
        );
      }
    }
    console.log(`✅ ${replies.length} ticket replies`);

    // 11. Projects
    const projects = [
      { name: 'Nairobi Hospital Network Overhaul', description: 'Complete network infrastructure upgrade including switches, APs, and firewalls', status: 'active', budget: 2500000, customer: 'Nairobi Hospital', start_date: d(30), end_date: d(-15) },
      { name: 'Safaricom POS Rollout', description: 'Deploy POS systems to 25 retail outlets', status: 'active', budget: 1800000, customer: 'Safaricom Business', start_date: d(45), end_date: d(-5) },
      { name: 'Acme Corp Office Setup', description: 'Full office IT setup: 50 workstations, networking, furniture', status: 'active', budget: 5200000, customer: 'Acme Corp Kenya', start_date: d(60), end_date: d(-30) },
      { name: 'Greenfield Inventory System', description: 'Custom inventory management system for agriculture supply chain', status: 'planning', budget: 800000, customer: 'Greenfield Agriculture Ltd', start_date: d(10), end_date: d(-45) },
      { name: 'Ministry of Education Lab Upgrade', description: 'Set up 5 computer labs with 200 workstations total', status: 'planning', budget: 12000000, customer: '', start_date: d(5), end_date: d(-60) },
    ];

    const projectIds = {};
    for (const p of projects) {
      const custId = p.customer ? customerIds[p.customer] : null;
      const r = await query(
        `INSERT INTO projects (business_id, name, description, status, budget, customer_id, start_date, end_date, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [BUSINESS_ID, p.name, p.description, p.status, p.budget, custId, p.start_date, p.end_date, USER_ID]
      );
      projectIds[p.name] = r.rows[0].id;
    }
    console.log(`✅ ${projects.length} projects`);

    // 12. Project Tasks
    const tasks = [
      { project: 'Nairobi Hospital Network Overhaul', title: 'Site survey and network audit', status: 'done', priority: 'high', due: d(25) },
      { project: 'Nairobi Hospital Network Overhaul', title: 'Procure Cisco switches and APs', status: 'done', priority: 'high', due: d(20) },
      { project: 'Nairobi Hospital Network Overhaul', title: 'Install core switches in server room', status: 'in_progress', priority: 'high', due: d(10) },
      { project: 'Nairobi Hospital Network Overhaul', title: 'Configure VLANs and firewall rules', status: 'todo', priority: 'medium', due: d(5) },
      { project: 'Nairobi Hospital Network Overhaul', title: 'Wireless AP deployment - all floors', status: 'todo', priority: 'medium', due: d(2) },
      { project: 'Safaricom POS Rollout', title: 'POS hardware procurement (25 units)', status: 'done', priority: 'high', due: d(35) },
      { project: 'Safaricom POS Rollout', title: 'Software installation and configuration', status: 'in_progress', priority: 'high', due: d(8) },
      { project: 'Safaricom POS Rollout', title: 'Staff training at pilot locations', status: 'todo', priority: 'medium', due: d(3) },
      { project: 'Acme Corp Office Setup', title: 'Workspace design and planning', status: 'done', priority: 'high', due: d(50) },
      { project: 'Acme Corp Office Setup', title: 'Furniture delivery and assembly', status: 'in_progress', priority: 'medium', due: d(12) },
      { project: 'Acme Corp Office Setup', title: 'Network cabling and workstation setup', status: 'todo', priority: 'high', due: d(5) },
      { project: 'Greenfield Inventory System', title: 'Requirements gathering', status: 'in_progress', priority: 'high', due: d(5) },
      { project: 'Greenfield Inventory System', title: 'UI/UX design mockups', status: 'todo', priority: 'medium', due: d(1) },
    ];

    for (const task of tasks) {
      const projectId = projectIds[task.project];
      if (projectId) {
        await query(
          `INSERT INTO project_tasks (business_id, project_id, title, status, priority, due_date) VALUES ($1,$2,$3,$4,$5,$6)`,
          [BUSINESS_ID, projectId, task.title, task.status, task.priority, task.due]
        );
      }
    }
    console.log(`✅ ${tasks.length} project tasks`);

    // 13. Time Entries
    const timeEntries = [
      { project: 'Nairobi Hospital Network Overhaul', description: 'Configured core switches and VLANs', duration: 240, date: d(2) },
      { project: 'Nairobi Hospital Network Overhaul', description: 'On-site fiber cable testing', duration: 360, date: d(3) },
      { project: 'Safaricom POS Rollout', description: 'POS software deployment at Westlands outlet', duration: 180, date: d(1) },
      { project: 'Safaricom POS Rollout', description: 'Integration testing with payment gateway', duration: 120, date: d(2) },
      { project: 'Acme Corp Office Setup', description: 'Coordinated furniture delivery logistics', duration: 90, date: d(1) },
      { project: 'Acme Corp Office Setup', description: 'Network design review with team', duration: 60, date: d(3) },
      { project: 'Greenfield Inventory System', description: 'Client requirements meeting', duration: 120, date: d(4) },
      { project: 'Greenfield Inventory System', description: 'Database schema design', duration: 240, date: d(5) },
    ];

    for (const te of timeEntries) {
      const projectId = projectIds[te.project];
      if (projectId) {
        const startTime = new Date(te.date);
        const endTime = new Date(startTime.getTime() + te.duration * 60000);
        await query(
          `INSERT INTO time_entries (business_id, user_id, project_id, description, date, start_time, end_time, duration_minutes, is_billable) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [BUSINESS_ID, USER_ID, projectId, te.description, te.date, startTime.toISOString(), endTime.toISOString(), te.duration, true]
        );
      }
    }
    console.log(`✅ ${timeEntries.length} time entries`);

    // 14. Vendors
    const vendors = [
      { name: 'Dell Technologies Kenya', email: 'orders@dell.co.ke', phone: '+254711000001', contact_person: 'James Maina', payment_terms: 'Net 30', address: 'Industrial Area, Nairobi' },
      { name: 'HP Distribution East Africa', email: 'sales@hp-ea.com', phone: '+254722000002', contact_person: 'Mary Wambui', payment_terms: 'Net 45', address: 'Mombasa Road' },
      { name: 'Samsung Business KE', email: 'b2b@samsung.co.ke', phone: '+254733000003', contact_person: 'Ali Hassan', payment_terms: 'Net 30', address: 'Upper Hill, Nairobi' },
      { name: 'Cisco Systems Kenya', email: 'orders@cisco.co.ke', phone: '+254744000004', contact_person: 'Peter Ouma', payment_terms: 'Net 60', address: 'Westlands' },
      { name: 'Office Furniture Plus', email: 'info@officefurniture.co.ke', phone: '+254755000005', contact_person: 'Grace Njeri', payment_terms: '50% upfront', address: 'Likoni Road, Mombasa' },
      { name: 'Logitech East Africa', email: 'wholesale@logitech-ea.com', phone: '+254766000006', contact_person: 'Samuel Kimani', payment_terms: 'Net 30', address: 'Riverside Drive' },
    ];

    const vendorIds = {};
    for (const v of vendors) {
      const r = await query(
        `INSERT INTO vendors (business_id, name, email, phone, contact_person, payment_terms, address) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [BUSINESS_ID, v.name, v.email, v.phone, v.contact_person, v.payment_terms, v.address]
      );
      vendorIds[v.name] = r.rows[0].id;
    }
    console.log(`✅ ${vendors.length} vendors`);

    // 15. Purchase Orders
    const purchaseOrders = [
      { vendor: 'Dell Technologies Kenya', items: [{ sku: 'DTL-OP-7090', qty: 20, price: 65000 }], status: 'approved', date: d(15) },
      { vendor: 'Cisco Systems Kenya', items: [{ sku: 'NET-CS-24P', qty: 5, price: 45000 }, { sku: 'CBL-CAT6-100', qty: 20, price: 3500 }], status: 'approved', date: d(10) },
      { vendor: 'Samsung Business KE', items: [{ sku: 'MON-SAM-27', qty: 30, price: 22000 }], status: 'pending', date: d(5) },
      { vendor: 'HP Distribution East Africa', items: [{ sku: 'PRT-HP-LJ', qty: 10, price: 28000 }], status: 'received', date: d(25) },
      { vendor: 'Office Furniture Plus', items: [{ sku: 'FRN-SD-ELC', qty: 15, price: 35000 }, { sku: 'FRN-CHR-ERG', qty: 20, price: 18000 }], status: 'pending', date: d(3) },
    ];

    let poCounter = 500;
    for (const po of purchaseOrders) {
      poCounter++;
      const vendorId = vendorIds[po.vendor];
      const subtotal = po.items.reduce((sum, i) => sum + i.qty * i.price, 0);
      const tax = Math.round(subtotal * 0.16);
      const total = subtotal + tax;

      const r = await query(
        `INSERT INTO purchase_orders (business_id, po_number, vendor_id, status, order_date, subtotal, tax_amount, total, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [BUSINESS_ID, `PO-${poCounter}`, vendorId, po.status, po.date, subtotal, tax, total, USER_ID]
      );
      const poId = r.rows[0].id;

      for (const item of po.items) {
        const prodId = productIds[item.sku];
        await query(
          `INSERT INTO po_items (business_id, po_id, product_id, product_name, qty, unit_price, total) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [BUSINESS_ID, poId, prodId, item.sku, item.qty, item.price, item.qty * item.price]
        );
      }
    }
    console.log(`✅ ${purchaseOrders.length} purchase orders`);

    console.log('\n🎉 Demo data seeding complete!');

    await pool.end();
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

seedDemo();
