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
  // Delete a tenant (and cascade delete related data)
  async deleteTenant(req, res, next) {
    try {
      await tenantService.deleteTenant(req.params.id);
      res.json({ success: true, message: 'Tenant deleted successfully' });
    } catch (err) {
      next(err);
    }
  },
  // ---------- USER MANAGEMENT (SUPER ADMIN) ----------
  // Get all users of a tenant
  async getUsers(req, res, next) {
    try {
      const users = await tenantService.getUsers(req.params.id);
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },

  // Create a new user for a tenant
  async createUser(req, res, next) {
    try {
      const user = await tenantService.createUser(req.params.id, req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  // Update an existing user of a tenant
  async updateUser(req, res, next) {
    try {
      const { tenantId, userId } = req.params;
      const user = await tenantService.updateUser(tenantId, userId, req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  // Delete a user from a tenant
  async deleteUser(req, res, next) {
    try {
      const { tenantId, userId } = req.params;
      await tenantService.deleteUser(tenantId, userId);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  // Reset password for a user
  async resetPassword(req, res, next) {
    try {
      const { tenantId, userId } = req.params;
      const { newPassword } = req.body;
      await tenantService.resetPassword(tenantId, userId, newPassword);
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
      next(err);
    }
  },    
  
};

module.exports = tenantController;
