const express = require('express');
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, u.full_name as cashier_name
      FROM sales s
      LEFT JOIN users u ON s.cashier_id = u.id
      ORDER BY s.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const [sales] = await pool.query(`
      SELECT s.*, u.full_name as cashier_name
      FROM sales s
      LEFT JOIN users u ON s.cashier_id = u.id
      WHERE s.id = ?
    `, [req.params.id]);
    if (sales.length === 0) return res.status(404).json({ message: 'Sale not found' });

    const [items] = await pool.query(`
      SELECT si.*, p.name as product_name, p.barcode
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, [req.params.id]);

    res.json({ ...sales[0], items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { items, payment_method, amount_paid } = req.body;

    let total_amount = 0;
    for (const item of items) {
      const [products] = await connection.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
      if (products.length === 0) throw new Error(`Product ${item.product_id} not found`);
      if (products[0].quantity < item.quantity) throw new Error(`Insufficient stock for ${products[0].name}`);
      total_amount += products[0].selling_price * item.quantity;
    }

    const [saleResult] = await connection.query(
      'INSERT INTO sales (total_amount, payment_method, amount_paid, change_amount, cashier_id) VALUES (?, ?, ?, ?, ?)',
      [total_amount, payment_method, amount_paid, amount_paid - total_amount, req.user.id]
    );

    for (const item of items) {
      const [products] = await connection.query('SELECT * FROM products WHERE id = ?', [item.product_id]);
      const product = products[0];
      await connection.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
        [saleResult.insertId, item.product_id, item.quantity, product.selling_price, product.selling_price * item.quantity]
      );
      await connection.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await connection.commit();
    res.status(201).json({ id: saleResult.insertId, total_amount, payment_method, amount_paid });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
