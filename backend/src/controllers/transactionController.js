const transactionService = require('../services/transactionService');

const transactionController = {
  async create(req, res, next) {
    try {
      const { items, customerEmail, customerName, paymentMethod, notes, discount } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Items are required' });
      }
      const transaction = await transactionService.create(req.tenantId, req.user.userId, {
        items, customerEmail, customerName, paymentMethod, notes, discount: +discount || 0,
      });
      res.status(201).json({ success: true, data: transaction });
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const { page, limit, dateFrom, dateTo } = req.query;
      const result = await transactionService.getAll(req.tenantId, {
        page: +page || 1, limit: +limit || 20, dateFrom, dateTo,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const transaction = await transactionService.getById(req.tenantId, req.params.id);
      res.json({ success: true, data: transaction });
    } catch (err) {
      res.status(404).json({ success: false, message: err.message });
    }
  },
};

module.exports = transactionController;