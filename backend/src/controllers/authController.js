const authService = require('../services/authService');

const authController = {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
      }
      const result = await authService.login(username, password);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(401).json({ success: false, message: err.message });
    }
  },

  async me(req, res) {
    res.json({ success: true, data: req.user });
  },

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Both passwords required' });
      }
      await authService.changePassword(req.user.userId, req.tenantId, currentPassword, newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};

module.exports = authController;