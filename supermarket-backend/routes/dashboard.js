const express = require('express');
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const [totalProducts] = await pool.query('SELECT COUNT(*) as count FROM products');
    const [totalCategories] = await pool.query('SELECT COUNT(*) as count FROM categories');
    const [totalSuppliers] = await pool.query('SELECT COUNT(*) as count FROM suppliers');
    const [totalSales] = await pool.query('SELECT COUNT(*) as count FROM sales');
    const [totalRevenue] = await pool.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales');
    const [lowStock] = await pool.query('SELECT COUNT(*) as count FROM products WHERE quantity <= 10');
    const [todaySales] = await pool.query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(created_at) = CURDATE()'
    );
    const [recentSales] = await pool.query(`
      SELECT s.*, u.full_name as cashier_name
      FROM sales s
      LEFT JOIN users u ON s.cashier_id = u.id
      ORDER BY s.created_at DESC LIMIT 5
    `);
    const [lowStockProducts] = await pool.query(
      'SELECT * FROM products WHERE quantity <= 10 ORDER BY quantity ASC LIMIT 5'
    );

    res.json({
      totalProducts: totalProducts[0].count,
      totalCategories: totalCategories[0].count,
      totalSuppliers: totalSuppliers[0].count,
      totalSales: totalSales[0].count,
      totalRevenue: totalRevenue[0].total,
      lowStockCount: lowStock[0].count,
      todaySales: todaySales[0].total,
      recentSales,
      lowStockProducts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
