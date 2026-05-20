const dashboardService = require('../services/dashboardService');

const dashboardController = {
  async getStats(req, res, next) {
    try {
      const { period } = req.query;
      const stats = await dashboardService.getStats(req.tenantId, period || 'today');
      res.json({ success: true, data: stats });
    } catch (err) { next(err); }
  },

  async getRecentTransactions(req, res, next) {
    try {
      const { limit } = req.query;
      const transactions = await dashboardService.getRecentTransactions(req.tenantId, +limit || 5);
      res.json({ success: true, data: transactions });
    } catch (err) { next(err); }
  },
};

module.exports = dashboardController;