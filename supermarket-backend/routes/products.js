const express = require('express');
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = `
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      query += ' AND (p.name LIKE ? OR p.barcode LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }
    query += ' ORDER BY p.name';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name, s.name as supplier_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, barcode, category_id, supplier_id, quantity, buying_price, selling_price, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO products (name, barcode, category_id, supplier_id, quantity, buying_price, selling_price, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, barcode, category_id || null, supplier_id || null, quantity || 0, buying_price, selling_price, description]
    );
    res.status(201).json({ id: result.insertId, name, barcode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, barcode, category_id, supplier_id, quantity, buying_price, selling_price, description } = req.body;
    await pool.query(
      'UPDATE products SET name = ?, barcode = ?, category_id = ?, supplier_id = ?, quantity = ?, buying_price = ?, selling_price = ?, description = ? WHERE id = ?',
      [name, barcode, category_id || null, supplier_id || null, quantity, buying_price, selling_price, description, req.params.id]
    );
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
