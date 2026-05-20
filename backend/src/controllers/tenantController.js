const tenantService = require('../services/tenantService');

const tenantController = {
  async getAll(req, res, next) {
    try {
      const tenants = await tenantService.getAll();
      res.json({ success: true, data: tenants });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const tenant = await tenantService.getById(req.params.id);
      const stats = await tenantService.getStats(req.params.id);
      res.json({ success: true, data: { ...tenant, stats } });
    } catch (err) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async create(req, res, next) {
    try {
      const result = await tenantService.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async update(req, res, next) {
    try {
      const tenant = await tenantService.update(req.params.id, req.body);
      res.json({ success: true, data: tenant });
    } catch (err) { next(err); }
  },

  async getStats(req, res, next) {
    try {
      const stats = await tenantService.getStats(req.params.id);
      res.json({ success: true, data: stats });
    } catch (err) { next(err); }
  },
};

module.exports = tenantController;
