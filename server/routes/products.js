import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ========== MODULE 2: PRODUCTS / INVENTORY ==========

// Get all products
router.get('/', authenticate, async (req, res) => {
  try {
    const { low_stock, category } = req.query;
    let sql = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.business_id = $1';
    const params = [req.business_id];

    if (low_stock === 'true') {
      sql += ' AND p.stock_qty <= p.reorder_level';
    }
    if (category) {
      sql += ' AND p.category_id = $2';
      params.push(category);
    }

    sql += ' ORDER BY p.name';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get categories
router.get('/categories', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories WHERE business_id = $1 ORDER BY name', [req.business_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create category
router.post('/categories', authenticate, async (req, res) => {
  try {
    const { name, description, parent_id } = req.body;
    const result = await query(
      'INSERT INTO categories (business_id, name, description, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.business_id, name, description, parent_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, sku, barcode, description, category_id, unit, cost_price, selling_price, stock_qty, reorder_level, image_url } = req.body;
    const result = await query(
      `INSERT INTO products (business_id, name, sku, barcode, description, category_id, unit, cost_price, selling_price, stock_qty, reorder_level, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [req.business_id, name, sku, barcode, description, category_id, unit || 'piece', cost_price || 0, selling_price || 0, stock_qty || 0, reorder_level || 10, image_url]
    );

    // Record initial stock movement if qty > 0
    if (stock_qty > 0) {
      await query(
        `INSERT INTO stock_movements (business_id, product_id, qty_before, qty_change, qty_after, reason)
         VALUES ($1, $2, 0, $3, $3, 'initial_stock')`,
        [req.business_id, result.rows[0].id, stock_qty]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, sku, barcode, description, category_id, unit, cost_price, selling_price, stock_qty, reorder_level, is_active, image_url } = req.body;
    
    // Get current qty
    const current = await query('SELECT stock_qty FROM products WHERE id=$1 AND business_id=$2', [req.params.id, req.business_id]);
    if (current.rows.length === 0) return res.status(404).json({ error: 'Product not found' });

    const oldQty = parseInt(current.rows[0].stock_qty || 0);
    const newQty = parseInt(stock_qty || 0);
    const qtyDiff = newQty - oldQty;

    const result = await query(
      `UPDATE products SET name=$1, sku=$2, barcode=$3, description=$4, category_id=$5, unit=$6, cost_price=$7, selling_price=$8, 
       stock_qty=$9, reorder_level=$10, is_active=$11, image_url=$12, updated_at=NOW()
       WHERE id=$13 AND business_id=$14 RETURNING *`,
      [name, sku, barcode, description, category_id, unit, cost_price, selling_price, newQty, reorder_level, is_active, image_url, req.params.id, req.business_id]
    );

    // Record stock movement if qty changed
    if (qtyDiff !== 0) {
      await query(
        `INSERT INTO stock_movements (business_id, product_id, qty_before, qty_change, qty_after, reason)
         VALUES ($1, $2, $3, $4, $5, 'adjustment')`,
        [req.business_id, req.params.id, oldQty, qtyDiff, newQty]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query('DELETE FROM products WHERE id=$1 AND business_id=$2 RETURNING id', [req.params.id, req.business_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stock movements for a product
router.get('/:id/stock-history', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM stock_movements WHERE product_id=$1 AND business_id=$2 ORDER BY created_at DESC',
      [req.params.id, req.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;