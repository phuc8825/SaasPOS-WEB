const supabase = require('../config/supabase');

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
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, total, created_at, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());

    if (error) throw new Error(error.message);

    const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const totalOrders = transactions.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top products
    const { data: topItems } = await supabase
      .from('transaction_items')
      .select('product_name, quantity, subtotal, transactions!inner(tenant_id, status, created_at)')
      .eq('transactions.tenant_id', tenantId)
      .eq('transactions.status', 'completed')
      .gte('transactions.created_at', startDate.toISOString())
      .lt('transactions.created_at', endDate.toISOString());

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
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

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
    const { data, error } = await supabase
      .from('transactions')
      .select('id, transaction_code, total, customer_name, payment_method, created_at, status')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data;
  },
};

module.exports = dashboardService;