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

  async deleteTenant(req, res, next) {
    try {
      await tenantService.deleteTenant(req.params.id);
      res.json({ success: true, message: 'Shop đã được xóa' });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await tenantService.getStats(req.params.id);
      res.json({ success: true, data: stats });
    } catch (err) { next(err); }
  },

  // ---- User management ----
  async getUsers(req, res, next) {
    try {
      const users = await tenantService.getUsers(req.params.id);
      res.json({ success: true, data: users });
    } catch (err) { next(err); }
  },

  async createUser(req, res, next) {
    try {
      const user = await tenantService.createUser(req.params.id, req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateUser(req, res, next) {
    try {
      const user = await tenantService.updateUser(req.params.tenantId, req.params.userId, req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async deleteUser(req, res, next) {
    try {
      await tenantService.deleteUser(req.params.tenantId, req.params.userId);
      res.json({ success: true, message: 'Tài khoản đã được xóa' });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};

module.exports = tenantController;