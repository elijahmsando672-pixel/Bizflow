import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

const RESOURCES = ['customers', 'products', 'sales', 'expenses', 'invoices', 'leads', 'deals', 'tickets', 'projects', 'vendors', 'purchase_orders', 'employees', 'team', 'reports'];
const DEFAULT_ROLES = ['admin', 'manager', 'staff', 'viewer'];

router.get('/roles', async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT role_name FROM permissions WHERE business_id = $1 ORDER BY role_name`,
      [req.business_id]
    );
    const roles = result.rows.map(r => r.role_name);
    const defaultRoles = DEFAULT_ROLES.filter(r => !roles.includes(r));
    res.json([...defaultRoles, ...roles]);
  } catch (error) {
    console.error('Fetch roles error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

router.get('/permissions', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM permissions WHERE business_id = $1 ORDER BY role_name, resource`,
      [req.business_id]
    );
    if (!result.rows.length) {
      const defaults = [];
      const rolePermissions = {
        admin: { can_create: true, can_read: true, can_update: true, can_delete: true },
        manager: { can_create: true, can_read: true, can_update: true, can_delete: false },
        staff: { can_create: true, can_read: true, can_update: false, can_delete: false },
        viewer: { can_create: false, can_read: true, can_update: false, can_delete: false },
      };
      for (const role of DEFAULT_ROLES) {
        for (const resource of RESOURCES) {
          defaults.push(query(
            `INSERT INTO permissions (business_id, role_name, resource, can_create, can_read, can_update, can_delete) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [req.business_id, role, resource, rolePermissions[role].can_create, rolePermissions[role].can_read, rolePermissions[role].can_update, rolePermissions[role].can_delete]
          ));
        }
      }
      await Promise.all(defaults);
      const freshResult = await query(
        `SELECT * FROM permissions WHERE business_id = $1 ORDER BY role_name, resource`,
        [req.business_id]
      );
      return res.json(freshResult.rows);
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch permissions error:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

router.put('/permissions/:id', async (req, res) => {
  try {
    const { can_create, can_read, can_update, can_delete } = req.body;
    const result = await query(
      `UPDATE permissions SET can_create=$2, can_read=$3, can_update=$4, can_delete=$5 WHERE id=$1 AND business_id=$6 RETURNING *`,
      [req.params.id, can_create, can_read, can_update, can_delete, req.business_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Permission not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({ error: 'Failed to update permission' });
  }
});

router.post('/permissions/bulk', async (req, res) => {
  try {
    const { role_name, permissions } = req.body;
    const updates = [];
    for (const perm of permissions) {
      updates.push(query(
        `UPDATE permissions SET can_create=$1, can_read=$2, can_update=$3, can_delete=$4 WHERE business_id=$5 AND role_name=$6 AND resource=$7`,
        [perm.can_create, perm.can_read, perm.can_update, perm.can_delete, req.business_id, role_name, perm.resource]
      ));
    }
    await Promise.all(updates);
    res.json({ message: 'Permissions updated' });
  } catch (error) {
    console.error('Bulk update permissions error:', error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

router.get('/check', async (req, res) => {
  try {
    const { role, resource } = req.query;
    if (!role || !resource) return res.status(400).json({ error: 'role and resource required' });
    const result = await query(
      `SELECT * FROM permissions WHERE business_id = $1 AND role_name = $2 AND resource = $3`,
      [req.business_id, role, resource]
    );
    if (!result.rows.length) return res.json({ can_create: false, can_read: false, can_update: false, can_delete: false });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Check permissions error:', error);
    res.status(500).json({ error: 'Failed to check permissions' });
  }
});

export default router;
