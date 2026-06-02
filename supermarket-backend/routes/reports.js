const express = require('express');
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/sales', auth, async (req, res) => {
  try {
    const { start, end, payment_method } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (start) {
      whereClause += ' AND s.created_at >= ?';
      params.push(start);
    }
    if (end) {
      whereClause += ' AND s.created_at <= ?';
      params.push(end + ' 23:59:59');
    }
    if (payment_method) {
      whereClause += ' AND s.payment_method = ?';
      params.push(payment_method);
    }

    const [sales] = await pool.query(`
      SELECT s.*, u.full_name as cashier_name
      FROM sales s
      LEFT JOIN users u ON s.cashier_id = u.id
      ${whereClause}
      ORDER BY s.created_at DESC
    `, params);

    const [totalRevenue] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM sales s ${whereClause}`, params
    );

    const [totalCount] = await pool.query(
      `SELECT COUNT(*) as count FROM sales s ${whereClause}`, params
    );

    const [paymentRows] = await pool.query(
      `SELECT payment_method, COALESCE(SUM(total_amount), 0) as total FROM sales s ${whereClause} GROUP BY payment_method`, params
    );

    const [itemsSold] = await pool.query(`
      SELECT COALESCE(SUM(si.quantity), 0) as total
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      ${whereClause.replace(/s\./g, 's.')}
    `, params);

    const [topProducts] = await pool.query(`
      SELECT si.product_id, p.name as product_name, SUM(si.quantity) as total_quantity, SUM(si.total_price) as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      ${whereClause.replace(/s\./g, 's.')}
      GROUP BY si.product_id, p.name
      ORDER BY total_quantity DESC
      LIMIT 5
    `, params);

    const paymentBreakdown = {};
    paymentRows.forEach(row => {
      paymentBreakdown[row.payment_method] = row.total;
    });

    const totalSales = totalCount[0].count;
    const totalRev = totalRevenue[0].total;

    res.json({
      sales,
      totalRevenue: totalRev,
      totalSales,
      averageSale: totalSales > 0 ? totalRev / totalSales : 0,
      totalItems: itemsSold[0].total,
      paymentBreakdown,
      topProducts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
