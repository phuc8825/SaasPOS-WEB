const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const authService = {
  async login(username, password) {
    // 1. Thử tìm trong bảng super_admins trước
    const { data: superAdmin, error: superAdminError } = await supabase
      .from('super_admins')
      .select('id, username, email, password_hash, is_active')
      .eq('username', username)
      .eq('is_active', true)
      .single();

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
    const { data: user, error } = await supabase
      .from('users')
      .select('id, tenant_id, username, email, password_hash, role, is_active')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error || !user) throw new Error('Invalid username or password');

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new Error('Invalid username or password');

    // Lấy thông tin tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, email, phone, address, logo_url')
      .eq('id', user.tenant_id)
      .single();

    if (tenantError || !tenant) throw new Error('Tenant not found');

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
      const { data: superAdmin, error } = await supabase
        .from('super_admins')
        .select('id, password_hash')
        .eq('id', userId)
        .single();

      if (error || !superAdmin) throw new Error('User not found');

      const isValid = await bcrypt.compare(currentPassword, superAdmin.password_hash);
      if (!isValid) throw new Error('Current password is incorrect');

      const hash = await bcrypt.hash(newPassword, 10);
      const { error: updateError } = await supabase
        .from('super_admins')
        .update({ password_hash: hash })
        .eq('id', userId);

      if (updateError) throw new Error('Failed to update password');
      return true;
    }

    // Nếu là user thường
    const { data: user, error } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !user) throw new Error('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) throw new Error('Current password is incorrect');

    const hash = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hash })
      .eq('id', userId)
      .eq('tenant_id', tenantId);

    if (updateError) throw new Error('Failed to update password');
    return true;
  },
};

module.exports = authService;