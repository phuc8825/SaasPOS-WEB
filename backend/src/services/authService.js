const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authService = {
  async login(username, password) {
    // 1. Thử tìm trong bảng super_admins trước
    const superAdminRes = await db.query(
      'SELECT id, username, email, password_hash, is_active FROM super_admins WHERE username = $1 AND is_active = true',
      [username]
    );
    const superAdmin = superAdminRes.rows[0];

    if (superAdmin) {
      const isValid = await bcrypt.compare(password, superAdmin.password_hash);
      if (!isValid) throw new Error('Invalid username or password');

      const token = jwt.sign(
        { userId: superAdmin.id, role: 'super_admin', isSuperAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return {
        token,
        user: {
          id: superAdmin.id,
          username: superAdmin.username,
          email: superAdmin.email,
          role: 'super_admin',
          tenantId: null,
        },
        tenant: null,
      };
    }

    // 2. Tìm trong bảng users (admin / cashier)
    const userRes = await db.query(
      'SELECT id, tenant_id, username, email, password_hash, role, is_active FROM users WHERE username = $1 AND is_active = true',
      [username]
    );
    const user = userRes.rows[0];

    if (!user) throw new Error('Invalid username or password');

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new Error('Invalid username or password');

    // Lấy thông tin tenant
    const tenantRes = await db.query(
      'SELECT id, name, slug, email, phone, address, logo_url FROM tenants WHERE id = $1',
      [user.tenant_id]
    );
    const tenant = tenantRes.rows[0];

    if (!tenant) throw new Error('Tenant not found');

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
      },
      tenant,
    };
  },

  async changePassword(userId, tenantId, currentPassword, newPassword) {
    // Nếu là super admin
    if (!tenantId) {
      const superAdminRes = await db.query(
        'SELECT id, password_hash FROM super_admins WHERE id = $1',
        [userId]
      );
      const superAdmin = superAdminRes.rows[0];

      if (!superAdmin) throw new Error('User not found');

      const isValid = await bcrypt.compare(currentPassword, superAdmin.password_hash);
      if (!isValid) throw new Error('Current password is incorrect');

      const hash = await bcrypt.hash(newPassword, 10);
      await db.query(
        'UPDATE super_admins SET password_hash = $1 WHERE id = $2',
        [hash, userId]
      );

      return true;
    }

    // Nếu là user thường
    const userRes = await db.query(
      'SELECT id, password_hash FROM users WHERE id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );
    const user = userRes.rows[0];

    if (!user) throw new Error('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) throw new Error('Current password is incorrect');

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 AND tenant_id = $3',
      [hash, userId, tenantId]
    );

    return true;
  },
};

module.exports = authService;