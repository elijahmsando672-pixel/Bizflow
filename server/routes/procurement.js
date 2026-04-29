import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

let poCounter = null;

async function getNextPONumber(businessId) {
  if (!poCounter) {
    const result = await query(`SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 3) AS INTEGER)), 0) as max_num FROM purchase_orders WHERE business_id = $1`, [businessId]);
    poCounter = result.rows[0].max_num;
  }
  poCounter++;
  return `PO-${String(poCounter).padStart(5, '0')}`;
}

// Vendors
router.post('/vendors', async (req, res) => {
  try {
    const { name, email, phone, address, contact_person, payment_terms, notes } = req.body;
    const result = await query(
      `INSERT INTO vendors (business_id, name, email, phone, address, contact_person, payment_terms, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.business_id, name, email, phone, address, contact_person, payment_terms, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

router.get('/vendors', async (req, res) => {
  try {
    const result = await query(
      `SELECT v.*, COUNT(po.id) as total_orders, COALESCE(SUM(po.total), 0) as total_spent
       FROM vendors v
       LEFT JOIN purchase_orders po ON v.id = po.vendor_id
       WHERE v.business_id = $1
       GROUP BY v.id
       ORDER BY v.name`,
      [req.business_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

router.get('/vendors/:id', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM vendors WHERE id = $1 AND business_id = $2`, [req.params.id, req.business_id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

router.put('/vendors/:id', async (req, res) => {
  try {
    const { name, email, phone, address, contact_person, payment_terms, rating, notes } = req.body;
    const result = await query(
      `UPDATE vendors SET name=COALESCE($2,name), email=COALESCE($3,email), phone=COALESCE($4,phone),
       address=COALESCE($5,address), contact_person=COALESCE($6,contact_person), payment_terms=COALESCE($7,payment_terms),
       rating=COALESCE($8,rating), notes=COALESCE($9,notes), updated_at=CURRENT_TIMESTAMP
       WHERE id=$1 AND business_id=$10 RETURNING *`,
      [req.params.id, name, email, phone, address, contact_person, payment_terms, rating, notes, req.business_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

router.delete('/vendors/:id', async (req, res) => {
  try {
    const result = await query(`DELETE FROM vendors WHERE id = $1 AND business_id = $2`, [req.params.id, req.business_id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ message: 'Vendor deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

// Purchase Orders
router.post('/purchase-orders', async (req, res) => {
  try {
    const { vendor_id, expected_delivery, notes, items } = req.body;
    const poNumber = await getNextPONumber(req.business_id);

    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);
    const taxAmount = subtotal * 0.16;
    const total = subtotal + taxAmount;

    const poResult = await query(
      `INSERT INTO purchase_orders (business_id, po_number, vendor_id, expected_delivery, subtotal, tax_amount, total, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.business_id, poNumber, vendor_id, expected_delivery, subtotal, taxAmount, total, notes, req.user_id]
    );

    const poId = poResult.rows[0].id;

    if (items && items.length > 0) {
      await Promise.all(
        items.map(item => query(
          `INSERT INTO po_items (business_id, po_id, product_id, product_name, qty, unit_price, total)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [req.business_id, poId, item.product_id, item.product_name, item.qty, item.unit_price, item.qty * item.unit_price]
        ))
      );
    }

    const fullResult = await query(`SELECT * FROM purchase_orders WHERE id = $1`, [poId]);
    const poItems = await query(`SELECT * FROM po_items WHERE po_id = $1`, [poId]);
    res.status(201).json({ ...fullResult.rows[0], items: poItems.rows });
  } catch (error) {
    console.error('Create PO error:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

router.get('/purchase-orders', async (req, res) => {
  try {
    const { status } = req.query;
    let conditions = ['po.business_id = $1'];
    const params = [req.business_id];
    let idx = 2;
    if (status) { conditions.push(`po.status = $${idx}`); params.push(status); idx++; }

    const result = await query(
      `SELECT po.*, v.name as vendor_name, u.name as created_by_name
       FROM purchase_orders po
       LEFT JOIN vendors v ON po.vendor_id = v.id
       LEFT JOIN users u ON po.created_by = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY po.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

router.get('/purchase-orders/:id', async (req, res) => {
  try {
    const poResult = await query(
      `SELECT po.*, v.name as vendor_name FROM purchase_orders po LEFT JOIN vendors v ON po.vendor_id = v.id
       WHERE po.id = $1 AND po.business_id = $2`,
      [req.params.id, req.business_id]
    );
    if (!poResult.rows.length) return res.status(404).json({ error: 'Purchase order not found' });

    const itemsResult = await query(`SELECT * FROM po_items WHERE po_id = $1`, [req.params.id]);
    res.json({ ...poResult.rows[0], items: itemsResult.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

router.put('/purchase-orders/:id', async (req, res) => {
  try {
    const { status, expected_delivery, notes } = req.body;
    const result = await query(
      `UPDATE purchase_orders SET status=COALESCE($2,status), expected_delivery=COALESCE($3,expected_delivery),
       notes=COALESCE($4,notes), updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND business_id=$5 RETURNING *`,
      [req.params.id, status, expected_delivery, notes, req.business_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Purchase order not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
});

router.delete('/purchase-orders/:id', async (req, res) => {
  try {
    await query(`DELETE FROM po_items WHERE po_id = $1 AND business_id = $2`, [req.params.id, req.business_id]);
    const result = await query(`DELETE FROM purchase_orders WHERE id = $1 AND business_id = $2`, [req.params.id, req.business_id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Purchase order not found' });
    res.json({ message: 'Purchase order deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
});

export default router;
