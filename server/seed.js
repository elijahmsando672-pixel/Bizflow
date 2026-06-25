import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'bizflow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const BIZ = '58ce52b4-3079-42d4-86a6-3d1621f94a06';
const USER = 'f7f5a5cc-8ecb-4822-bdf3-e7ed13904f28';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Customers ──
    const customers = [
      { name: 'Jane Mwangi', email: 'jane@email.com', phone: '+254712345601', company: 'Mwangis Grocers', credit_limit: 50000 },
      { name: 'Peter Kamau', email: 'peter@email.com', phone: '+254712345602', company: 'Kamau Hardware', credit_limit: 100000 },
      { name: 'Alice Wanjiku', email: 'alice@email.com', phone: '+254712345603', company: 'Wanjiku Boutique', credit_limit: 30000 },
      { name: 'John Ochieng', email: 'john@email.com', phone: '+254712345604', company: 'Ochieng Motors', credit_limit: 200000 },
      { name: 'Grace Ndung\'u', email: 'grace@email.com', phone: '+254712345605', credit_limit: 15000 },
      { name: 'Samuel Kiprop', email: 'sam@email.com', phone: '+254712345606', company: 'Kiprop Farms', credit_limit: 75000 },
      { name: 'Diana Akinyi', email: 'diana@email.com', phone: '+254712345607', credit_limit: 25000 },
      { name: 'Brian Kiplagat', email: 'brian@email.com', phone: '+254712345608', company: 'Kiplagat Electronics', credit_limit: 120000 },
      { name: 'Susan Chebet', email: 'susan@email.com', phone: '+254712345609', credit_limit: 20000 },
      { name: 'Tom Odhiambo', email: 'tom@email.com', phone: '+254712345610', company: 'Odhiambo Supplies', credit_limit: 60000 },
    ];
    const customerRows = [];
    for (const c of customers) {
      const r = await client.query(
        `INSERT INTO customers (business_id, name, email, phone, company, credit_limit)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [BIZ, c.name, c.email, c.phone, c.company || null, c.credit_limit]
      );
      customerRows.push(r.rows[0].id);
    }
    console.log(`✓ ${customers.length} customers`);

    // ── Expense Categories ──
    const expCats = [
      { name: 'Utilities', desc: 'Electricity, water, internet' },
      { name: 'Rent', desc: 'Shop and office rent' },
      { name: 'Salaries', desc: 'Employee salaries and wages' },
      { name: 'Transport', desc: 'Logistics and travel' },
      { name: 'Marketing', desc: 'Advertising and promotions' },
      { name: 'Office Supplies', desc: 'Stationery and office items' },
      { name: 'Maintenance', desc: 'Repairs and maintenance' },
      { name: 'M-Pesa Fees', desc: 'Mobile money transaction fees' },
    ];
    const expCatRows = [];
    for (const ec of expCats) {
      const r = await client.query(
        `INSERT INTO expense_categories (business_id, name, description) VALUES ($1,$2,$3) RETURNING id`,
        [BIZ, ec.name, ec.desc]
      );
      expCatRows.push(r.rows[0].id);
    }
    console.log(`✓ ${expCats.length} expense categories`);

    // ── Expense entries ──
    const expenses = [
      { cat: 0, desc: 'Electricity bill June', amount: 12500, date: '2026-06-05' },
      { cat: 0, desc: 'Water bill June', amount: 3400, date: '2026-06-08' },
      { cat: 0, desc: 'Internet fibre', amount: 5500, date: '2026-06-03' },
      { cat: 1, desc: 'Shop rent - June', amount: 45000, date: '2026-06-01' },
      { cat: 1, desc: 'Warehouse rent', amount: 30000, date: '2026-06-01' },
      { cat: 2, desc: 'Staff salaries June', amount: 185000, date: '2026-06-25' },
      { cat: 3, desc: 'Fuel - delivery van', amount: 8500, date: '2026-06-12' },
      { cat: 3, desc: 'Courier charges', amount: 2200, date: '2026-06-15' },
      { cat: 4, desc: 'Facebook ads June', amount: 15000, date: '2026-06-10' },
      { cat: 4, desc: 'Flyer printing', amount: 3500, date: '2026-06-07' },
      { cat: 5, desc: 'Printer toner', amount: 4800, date: '2026-06-14' },
      { cat: 5, desc: 'A4 paper reams', amount: 1600, date: '2026-06-02' },
      { cat: 6, desc: 'AC repair', amount: 6500, date: '2026-06-18' },
      { cat: 6, desc: 'Plumbing fix', amount: 2800, date: '2026-06-22' },
      { cat: 7, desc: 'M-Pesa transaction fees', amount: 9800, date: '2026-06-25' },
    ];
    for (const e of expenses) {
      await client.query(
        `INSERT INTO expenses (business_id, category_id, description, amount, date, created_by)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [BIZ, expCatRows[e.cat], e.desc, e.amount, e.date, USER]
      );
    }
    console.log(`✓ ${expenses.length} expenses`);

    // ── Categories (product) ──
    const categories = [
      { name: 'Electronics', desc: 'Electronic devices and accessories' },
      { name: 'Food & Beverages', desc: 'Food items and drinks' },
      { name: 'Clothing', desc: 'Apparel and fashion' },
      { name: 'Household', desc: 'Home and kitchen items' },
      { name: 'Stationery', desc: 'Office and school supplies' },
      { name: 'Hardware', desc: 'Tools and building materials' },
    ];
    const catRows = [];
    for (const c of categories) {
      const r = await client.query(
        `INSERT INTO categories (business_id, name, description) VALUES ($1,$2,$3) RETURNING id`,
        [BIZ, c.name, c.desc]
      );
      catRows.push(r.rows[0].id);
    }
    console.log(`✓ ${categories.length} product categories`);

    // ── Products / Items ──
    const products = [
      { name: 'Bluetooth Speaker', sku: 'ELE-001', cat: 0, cost: 800, price: 1500, stock: 45, reorder: 10 },
      { name: 'USB-C Cable 2m', sku: 'ELE-002', cat: 0, cost: 250, price: 500, stock: 120, reorder: 30 },
      { name: 'Wireless Mouse', sku: 'ELE-003', cat: 0, cost: 600, price: 1200, stock: 30, reorder: 10 },
      { name: 'Cooking Oil 5L', sku: 'FNB-001', cat: 1, cost: 650, price: 850, stock: 60, reorder: 20 },
      { name: 'Rice 10kg Bag', sku: 'FNB-002', cat: 1, cost: 1200, price: 1600, stock: 40, reorder: 15 },
      { name: 'Sugar 2kg', sku: 'FNB-003', cat: 1, cost: 280, price: 380, stock: 200, reorder: 50 },
      { name: 'Milk 1L', sku: 'FNB-004', cat: 1, cost: 55, price: 75, stock: 5, reorder: 50 },
      { name: 'Men\'s T-Shirt', sku: 'CLO-001', cat: 2, cost: 350, price: 700, stock: 80, reorder: 20 },
      { name: 'Women\'s Dress', sku: 'CLO-002', cat: 2, cost: 800, price: 1500, stock: 35, reorder: 10 },
      { name: 'Denim Jeans', sku: 'CLO-003', cat: 2, cost: 900, price: 1800, stock: 25, reorder: 10 },
      { name: 'Detergent 1kg', sku: 'HOU-001', cat: 3, cost: 180, price: 280, stock: 150, reorder: 40 },
      { name: 'Floor Mop', sku: 'HOU-002', cat: 3, cost: 250, price: 450, stock: 40, reorder: 15 },
      { name: 'Plastic Bucket 20L', sku: 'HOU-003', cat: 3, cost: 300, price: 550, stock: 55, reorder: 15 },
      { name: 'Exercise Book 96pg', sku: 'STA-001', cat: 4, cost: 65, price: 120, stock: 500, reorder: 200 },
      { name: 'Ballpoint Pen (Box)', sku: 'STA-002', cat: 4, cost: 200, price: 350, stock: 100, reorder: 30 },
      { name: 'Sticky Notes Pack', sku: 'STA-003', cat: 4, cost: 150, price: 280, stock: 3, reorder: 20 },
      { name: 'Hammer 500g', sku: 'HARD-001', cat: 5, cost: 400, price: 750, stock: 20, reorder: 10 },
      { name: 'Measuring Tape 5m', sku: 'HARD-002', cat: 5, cost: 180, price: 350, stock: 35, reorder: 15 },
      { name: 'Paint Brush 4"', sku: 'HARD-003', cat: 5, cost: 120, price: 250, stock: 2, reorder: 20 },
    ];
    const productRows = [];
    for (const p of products) {
      const r = await client.query(
        `INSERT INTO products (business_id, sku, name, category_id, cost_price, selling_price, stock_qty, reorder_level)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [BIZ, p.sku, p.name, catRows[p.cat], p.cost, p.price, p.stock, p.reorder]
      );
      productRows.push(r.rows[0].id);
    }
    console.log(`✓ ${products.length} products`);

    // ── Stock Movements ──
    const movements = [
      { pid: 0, change: 50, reason: 'initial_stock' },
      { pid: 6, change: 100, reason: 'initial_stock' },
      { pid: 13, change: 600, reason: 'initial_stock' },
      { pid: 3, change: 80, reason: 'initial_stock' },
      { pid: 0, change: -5, reason: 'damage' },
      { pid: 15, change: 50, reason: 'initial_stock' },
      { pid: 18, change: 30, reason: 'initial_stock' },
      { pid: 6, change: -15, reason: 'expired' },
      { pid: 1, change: -3, reason: 'damage' },
    ];
    for (const m of movements) {
      await client.query(
        `INSERT INTO stock_movements (business_id, product_id, qty_before, qty_change, qty_after, reason)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [BIZ, productRows[m.pid], 0, m.change, m.change, m.reason]
      );
    }
    console.log(`✓ ${movements.length} stock movements`);

    // ── Sales ──
    const salesData = [
      { customer: 0, date: '2026-06-20', items: [[0, 2, 1500], [1, 3, 500]], status: 'completed' },
      { customer: 2, date: '2026-06-20', items: [[4, 1, 1600], [6, 10, 75]], status: 'completed' },
      { customer: null, date: '2026-06-21', items: [[7, 5, 700], [8, 2, 1500]], status: 'completed' },
      { customer: 1, date: '2026-06-21', items: [[3, 3, 850], [5, 20, 380]], status: 'completed' },
      { customer: 4, date: '2026-06-22', items: [[10, 10, 280], [11, 3, 450], [12, 2, 550]], status: 'completed' },
      { customer: 3, date: '2026-06-22', items: [[16, 2, 750], [17, 5, 350]], status: 'completed' },
      { customer: null, date: '2026-06-23', items: [[13, 50, 120], [14, 5, 350]], status: 'completed' },
      { customer: 5, date: '2026-06-23', items: [[0, 1, 1500], [2, 1, 1200]], status: 'pending' },
      { customer: 6, date: '2026-06-24', items: [[4, 2, 1600], [3, 1, 850]], status: 'completed' },
      { customer: 7, date: '2026-06-24', items: [[9, 3, 1800], [7, 4, 700]], status: 'completed' },
      { customer: null, date: '2026-06-25', items: [[1, 10, 500], [5, 5, 380]], status: 'completed' },
      { customer: 8, date: '2026-06-25', items: [[15, 10, 280], [13, 20, 120]], status: 'pending' },
    ];
    let saleCount = 0;
    for (const s of salesData) {
      const subtotal = s.items.reduce((sum, i) => sum + i[1] * i[2], 0);
      const total = subtotal;
      const invNum = `INV-${String(++saleCount).padStart(4, '0')}`;
      const sr = await client.query(
        `INSERT INTO sales (business_id, customer_id, invoice_number, status, sale_date, subtotal, total, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [BIZ, s.customer !== null ? customerRows[s.customer] : null, invNum, s.status, s.date, subtotal, total, USER]
      );
      const saleId = sr.rows[0].id;
      for (const item of s.items) {
        const [pid, qty, price] = item;
        await client.query(
          `INSERT INTO sale_items (business_id, sale_id, product_id, product_name, qty, unit_price, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [BIZ, saleId, productRows[pid], products[pid].name, qty, price, qty * price]
        );
        // update stock
        await client.query(
          `UPDATE products SET stock_qty = stock_qty - $1 WHERE id = $2`,
          [qty, productRows[pid]]
        );
      }
    }
    console.log(`✓ ${salesData.length} sales with items`);

    // ── Creditors (suppliers we owe) ──
    const creditors = [
      { name: 'Nairobi Wholesalers', email: 'info@nairobisupplies.com', phone: '+254722100201', opening: 45000 },
      { name: 'Coast Distributors', email: 'orders@coastdist.co.ke', phone: '+254722100202', opening: 28000 },
      { name: 'Highland Produce Ltd', email: 'sales@highlandproduce.com', phone: '+254722100203', opening: 62000 },
      { name: 'Ultra Logistics', email: 'dispatch@ultralogistics.com', phone: '+254722100204', opening: 15000 },
      { name: 'TechSource KE', email: 'info@techsource.co.ke', phone: '+254722100205', opening: 34000 },
    ];
    const creditorRows = [];
    for (const c of creditors) {
      const r = await client.query(
        `INSERT INTO creditors (business_id, name, email, phone, opening_balance)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [BIZ, c.name, c.email, c.phone, c.opening]
      );
      creditorRows.push(r.rows[0].id);
    }
    console.log(`✓ ${creditors.length} creditors`);

    // ── Creditor Purchases ──
    const credPurchases = [
      { cred: 0, ref: 'PO-001', amount: 120000, due: '2026-07-15' },
      { cred: 0, ref: 'PO-004', amount: 85000, due: '2026-07-20' },
      { cred: 1, ref: 'PO-002', amount: 65000, due: '2026-07-10' },
      { cred: 2, ref: 'PO-003', amount: 95000, due: '2026-07-25', paid: true },
      { cred: 3, ref: 'PO-005', amount: 42000, due: '2026-07-05' },
      { cred: 4, ref: 'PO-006', amount: 78000, due: '2026-07-18', paid: true },
    ];
    for (const cp of credPurchases) {
      await client.query(
        `INSERT INTO creditor_purchases (business_id, creditor_id, reference, amount, due_date, is_paid, date)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [BIZ, creditorRows[cp.cred], cp.ref, cp.amount, cp.due, cp.paid || false, '2026-06-15']
      );
    }
    console.log(`✓ ${credPurchases.length} creditor purchases`);

    // ── Creditor Payments ──
    const credPayments = [
      { cred: 0, amount: 45000, ref: 'PMT-001' },
      { cred: 2, amount: 95000, ref: 'PMT-002' },
      { cred: 4, amount: 34000, ref: 'PMT-003' },
      { cred: 1, amount: 20000, ref: 'PMT-004' },
    ];
    for (const cp of credPayments) {
      await client.query(
        `INSERT INTO creditor_payments (business_id, creditor_id, amount, reference, created_by)
         VALUES ($1,$2,$3,$4,$5)`,
        [BIZ, creditorRows[cp.cred], cp.amount, cp.ref, USER]
      );
    }
    console.log(`✓ ${credPayments.length} creditor payments`);

    // ── Debtors (customers who owe us) ──
    const debtors = [
      { name: 'John Ochieng', phone: '+254712345604', opening: 85000 },
      { name: 'Brian Kiplagat', phone: '+254712345608', opening: 42000 },
      { name: 'Mwangis Grocers', phone: '+254712345601', opening: 28000 },
      { name: 'Kiprop Farms', phone: '+254712345606', opening: 56000 },
      { name: 'Odhiambo Supplies', phone: '+254712345610', opening: 33000 },
    ];
    const debtorRows = [];
    for (const d of debtors) {
      const r = await client.query(
        `INSERT INTO debtors (business_id, name, phone, opening_balance)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [BIZ, d.name, d.phone, d.opening]
      );
      debtorRows.push(r.rows[0].id);
    }
    console.log(`✓ ${debtors.length} debtors`);

    // ── Debtor Invoices ──
    const debtorInvs = [
      { debtor: 0, ref: 'DINV-001', amount: 85000, due: '2026-07-30' },
      { debtor: 1, ref: 'DINV-002', amount: 42000, due: '2026-07-15' },
      { debtor: 2, ref: 'DINV-003', amount: 28000, due: '2026-07-10', paid: true },
      { debtor: 3, ref: 'DINV-004', amount: 56000, due: '2026-08-05' },
      { debtor: 4, ref: 'DINV-005', amount: 33000, due: '2026-07-20' },
    ];
    for (const di of debtorInvs) {
      await client.query(
        `INSERT INTO debtor_invoices (business_id, debtor_id, reference, amount, due_date, is_paid, date)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [BIZ, debtorRows[di.debtor], di.ref, di.amount, di.due, di.paid || false, '2026-06-10']
      );
    }
    console.log(`✓ ${debtorInvs.length} debtor invoices`);

    // ── Debtor Payments ──
    const debtorPayments = [
      { debtor: 2, amount: 28000, ref: 'DP-001' },
      { debtor: 0, amount: 20000, ref: 'DP-002' },
    ];
    for (const dp of debtorPayments) {
      await client.query(
        `INSERT INTO debtor_payments (business_id, debtor_id, amount, reference, created_by)
         VALUES ($1,$2,$3,$4,$5)`,
        [BIZ, debtorRows[dp.debtor], dp.amount, dp.ref, USER]
      );
    }
    console.log(`✓ ${debtorPayments.length} debtor payments`);

    // ── Cashflow Entries ──
    const cashflows = [
      { type: 'inflow', amount: 845000, desc: 'Sales revenue June', cat: 'sales' },
      { type: 'outflow', amount: 185000, desc: 'Staff salaries', cat: 'salaries' },
      { type: 'outflow', amount: 75000, desc: 'Rent payment', cat: 'rent' },
      { type: 'inflow', amount: 45000, desc: 'Creditor payment received', cat: 'receivables' },
      { type: 'outflow', amount: 120000, desc: 'Stock purchase', cat: 'inventory' },
      { type: 'inflow', amount: 28500, desc: 'M-Pesa float top-up', cat: 'mpesa' },
      { type: 'outflow', amount: 15000, desc: 'Marketing spend', cat: 'marketing' },
    ];
    for (const cf of cashflows) {
      await client.query(
        `INSERT INTO cashflow_entries (business_id, entry_type, amount, description, category, date)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [BIZ, cf.type, cf.amount, cf.desc, cf.cat, '2026-06-25']
      );
    }
    console.log(`✓ ${cashflows.length} cashflow entries`);

    // ── Vendors ──
    const vendors = [
      { name: 'TechSource KE', email: 'info@techsource.co.ke', phone: '+254722100205', contact: 'James Kip', terms: 'Net 30' },
      { name: 'FreshProduce Ltd', email: 'orders@freshproduce.com', phone: '+254722100301', contact: 'Mary Wanjiru', terms: 'Net 15' },
      { name: 'Uniform Supplies KE', email: 'info@uniforms.co.ke', phone: '+254722100302', contact: 'Paul Omondi', terms: 'Net 30' },
      { name: 'CleanHome Distributors', email: 'sales@cleanhome.com', phone: '+254722100303', contact: 'Jane Mutua', terms: 'Net 45' },
    ];
    const vendorRows = [];
    for (const v of vendors) {
      const r = await client.query(
        `INSERT INTO vendors (business_id, name, email, phone, contact_person, payment_terms)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [BIZ, v.name, v.email, v.phone, v.contact, v.terms]
      );
      vendorRows.push(r.rows[0].id);
    }
    console.log(`✓ ${vendors.length} vendors`);

    // ── Notifications ──
    const notifications = [
      { title: 'Low stock alert', msg: 'Milk 1L is running low (5 remaining)', type: 'warning', link: '/dashboard/stocks/low' },
      { title: 'New sale completed', msg: 'Sale INV-0001 completed successfully', type: 'success' },
      { title: 'Payment received', msg: 'KES 28,000 received from Mwangis Grocers', type: 'info' },
      { title: 'Expense recorded', msg: 'Staff salaries June: KES 185,000', type: 'info' },
      { title: 'Stock audit needed', msg: 'Paint Brush 4" has only 2 units left', type: 'warning', link: '/dashboard/inventory/audit' },
      { title: 'Overdue invoice', msg: 'Invoice DINV-001 from John Ochieng is overdue', type: 'error' },
      { title: 'New customer added', msg: 'Tom Odhiambo registered as a customer', type: 'success' },
    ];
    for (const n of notifications) {
      await client.query(
        `INSERT INTO notifications (business_id, user_id, title, message, type, link)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [BIZ, USER, n.title, n.msg, n.type, n.link || null]
      );
    }
    console.log(`✓ ${notifications.length} notifications`);

    // ── Employees ──
    const employees = [
      { first: 'James', last: 'Mwangi', pos: 'Shop Manager', dept: 'Operations', salary: 65000, hire: '2025-01-15' },
      { first: 'Sarah', last: 'Wanjiku', pos: 'Cashier', dept: 'Sales', salary: 35000, hire: '2025-03-01' },
      { first: 'David', last: 'Omondi', pos: 'Store Keeper', dept: 'Inventory', salary: 40000, hire: '2025-06-01' },
      { first: 'Mary', last: 'Ndung\'u', pos: 'Accountant', dept: 'Finance', salary: 55000, hire: '2025-02-15' },
      { first: 'Peter', last: 'Kamau', pos: 'Delivery Driver', dept: 'Logistics', salary: 30000, hire: '2025-04-01' },
    ];
    for (const e of employees) {
      await client.query(
        `INSERT INTO employees (business_id, first_name, last_name, position, department, salary, hire_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [BIZ, e.first, e.last, e.pos, e.dept, e.salary, e.hire]
      );
    }
    console.log(`✓ ${employees.length} employees`);

    // ── CRM Leads ──
    const leads = [
      { first: 'Kevin', last: 'Mutua', email: 'kevin@email.com', company: 'Mutua Enterprises', value: 150000, source: 'website', status: 'new' },
      { first: 'Faith', last: 'Nyambura', email: 'faith@email.com', company: 'Nyambura Styles', value: 75000, source: 'referral', status: 'contacted' },
      { first: 'Alex', last: 'Kiprono', email: 'alex@email.com', company: 'Kiprono Tech', value: 200000, source: 'social_media', status: 'qualified' },
      { first: 'Nancy', last: 'Chepkoech', email: 'nancy@email.com', value: 45000, source: 'walk_in', status: 'new' },
    ];
    for (const l of leads) {
      await client.query(
        `INSERT INTO leads (business_id, first_name, last_name, email, company, source, status, estimated_value, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [BIZ, l.first, l.last, l.email, l.company || null, l.source, l.status, l.value, USER]
      );
    }
    console.log(`✓ ${leads.length} leads`);

    // ── Deal Stages ──
    const stages = [
      { name: 'Prospecting', order: 0, prob: 10 },
      { name: 'Qualification', order: 1, prob: 25 },
      { name: 'Proposal', order: 2, prob: 50 },
      { name: 'Negotiation', order: 3, prob: 75 },
      { name: 'Closed Won', order: 4, prob: 100 },
    ];
    const stageRows = [];
    for (const st of stages) {
      const r = await client.query(
        `INSERT INTO deal_stages (business_id, name, order_index, win_probability, color)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [BIZ, st.name, st.order, st.prob, ['#94a3b8', '#60a5fa', '#f59e0b', '#8b5cf6', '#22c55e'][st.order]]
      );
      stageRows.push(r.rows[0].id);
    }
    console.log(`✓ ${stages.length} deal stages`);

    // ── Deals ──
    const deals = [
      { name: 'Mutua Enterprises bulk order', customer: 0, stage: 0, value: 150000, close: '2026-07-15' },
      { name: 'Nyambura Styles retail supplies', customer: 0, stage: 1, value: 75000, close: '2026-07-30' },
      { name: 'Kiprono Tech equipment', customer: 1, stage: 2, value: 200000, close: '2026-08-15' },
    ];
    for (const d of deals) {
      await client.query(
        `INSERT INTO deals (business_id, customer_id, name, stage_id, value, expected_close_date, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [BIZ, customerRows[d.customer], d.name, stageRows[d.stage], d.value, d.close, USER]
      );
    }
    console.log(`✓ ${deals.length} deals`);

    // ── Purchase Orders ──
    const pos = [
      { vendor: 0, po: 'PO-2026-001', total: 120000, status: 'received' },
      { vendor: 1, po: 'PO-2026-002', total: 85000, status: 'pending' },
      { vendor: 2, po: 'PO-2026-003', total: 45000, status: 'draft' },
    ];
    for (const po of pos) {
      await client.query(
        `INSERT INTO purchase_orders (business_id, po_number, vendor_id, status, total, created_by)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [BIZ, po.po, vendorRows[po.vendor], po.status, po.total, USER]
      );
    }
    console.log(`✓ ${pos.length} purchase orders`);

    await client.query('COMMIT');
    console.log('\n🎉 Database seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
