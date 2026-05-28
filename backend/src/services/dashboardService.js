const db = require('../config/db');

const dashboardService = {
  async getStats(tenantId, period = 'today') {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    // Transactions in period
    const txRes = await db.query(
      'SELECT id, total, created_at, status FROM transactions WHERE tenant_id = $1 AND status = $2 AND created_at >= $3 AND created_at < $4',
      [tenantId, 'completed', startDate.toISOString(), endDate.toISOString()]
    );
    const transactions = txRes.rows;

    const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const totalOrders = transactions.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top products
    const itemsRes = await db.query(
      `SELECT ti.product_name, ti.quantity, ti.subtotal 
       FROM transaction_items ti 
       JOIN transactions t ON ti.transaction_id = t.id 
       WHERE t.tenant_id = $1 AND t.status = $2 AND t.created_at >= $3 AND t.created_at < $4`,
      [tenantId, 'completed', startDate.toISOString(), endDate.toISOString()]
    );
    const topItems = itemsRes.rows;

    const productStats = {};
    (topItems || []).forEach((item) => {
      if (!productStats[item.product_name]) {
        productStats[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
      }
      productStats[item.product_name].quantity += item.quantity;
      productStats[item.product_name].revenue += parseFloat(item.subtotal);
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    // Revenue by day (last 7 days)
    const revenueByDay = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setDate(day.getDate() + 1);

      const dayRevenue = (transactions || [])
        .filter((t) => {
          const created = new Date(t.created_at);
          return created >= day && created < dayEnd;
        })
        .reduce((sum, t) => sum + parseFloat(t.total), 0);

      revenueByDay.push({
        date: day.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        revenue: dayRevenue,
      });
    }

    // Total products count
    const prodCountRes = await db.query(
      'SELECT count(*) FROM products WHERE tenant_id = $1 AND is_active = true',
      [tenantId]
    );
    const totalProducts = parseInt(prodCountRes.rows[0].count);

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      totalProducts: totalProducts || 0,
      topProducts,
      revenueByDay,
      period,
    };
  },

  async getRecentTransactions(tenantId, limit = 5) {
    const res = await db.query(
      'SELECT id, transaction_code, total, customer_name, payment_method, created_at, status FROM transactions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2',
      [tenantId, limit]
    );
    return res.rows;
  },
};

module.exports = dashboardService;