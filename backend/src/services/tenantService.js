const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');

const tenantService = {
  async getAll() {
    const { data, error } = await supabase
      .from('tenants')
      .select(`*, users(id, username, email, role, is_active)`)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  async getById(tenantId) {
    const { data, error } = await supabase
      .from('tenants')
      .select(`*, users(id, username, email, role, is_active)`)
      .eq('id', tenantId)
      .single();
    if (error) throw new Error('Tenant not found');
    return data;
  },

  async create({ name, slug, email, phone, address, ownerUsername, ownerEmail, ownerPassword }) {
    if (!name || !ownerUsername || !ownerPassword) {
      throw new Error('Tên shop, tên đăng nhập và mật khẩu là bắt buộc');
    }

    const generatedSlug = slug || name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { data: existing } = await supabase
      .from('tenants').select('id').eq('slug', generatedSlug).single();
    if (existing) throw new Error('Slug đã tồn tại, hãy dùng tên khác');

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name, slug: generatedSlug, email, phone, address })
      .select().single();
    if (tenantError) throw new Error(tenantError.message);

    const passwordHash = await bcrypt.hash(ownerPassword, 10);
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        tenant_id: tenant.id,
        username: ownerUsername,
        email: ownerEmail || email,
        password_hash: passwordHash,
        role: 'admin',
      })
      .select('id, username, email, role')
      .single();

    if (userError) {
      await supabase.from('tenants').delete().eq('id', tenant.id);
      throw new Error(userError.message);
    }

    return { tenant, owner: user };
  },

  async update(tenantId, data) {
    const { name, email, phone, address, logo_url } = data;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (logo_url !== undefined) updateData.logo_url = logo_url;

    const { data: updated, error } = await supabase
      .from('tenants').update(updateData).eq('id', tenantId).select().single();
    if (error) throw new Error(error.message);
    return updated;
  },

  async deleteTenant(tenantId) {
    // Cascade delete users, products, transactions theo schema
    const { error } = await supabase.from('tenants').delete().eq('id', tenantId);
    if (error) throw new Error(error.message);
    return true;
  },

  async getStats(tenantId) {
    const [productsRes, usersRes, transactionsRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_active', true),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_active', true),
      supabase.from('transactions').select('total').eq('tenant_id', tenantId).eq('status', 'completed'),
    ]);
    const totalRevenue = (transactionsRes.data || []).reduce((s, t) => s + parseFloat(t.total), 0);
    return {
      products: productsRes.count || 0,
      users: usersRes.count || 0,
      transactions: (transactionsRes.data || []).length,
      totalRevenue,
    };
  },

  // ---- User management ----
  async getUsers(tenantId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, is_active, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  async createUser(tenantId, { username, email, password, role = 'cashier' }) {
    if (!username || !password) throw new Error('Tên đăng nhập và mật khẩu là bắt buộc');
    if (!['admin', 'cashier'].includes(role)) throw new Error('Role không hợp lệ');

    // Kiểm tra username trùng trong tenant
    const { data: existing } = await supabase
      .from('users').select('id').eq('tenant_id', tenantId).eq('username', username).single();
    if (existing) throw new Error('Tên đăng nhập đã tồn tại trong shop này');

    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert({ tenant_id: tenantId, username, email, password_hash: passwordHash, role })
      .select('id, username, email, role, is_active, created_at')
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateUser(tenantId, userId, { username, email, password, role, is_active }) {
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) {
      if (!['admin', 'cashier'].includes(role)) throw new Error('Role không hợp lệ');
      updateData.role = role;
    }
    if (is_active !== undefined) updateData.is_active = is_active;
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select('id, username, email, role, is_active, created_at')
      .single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('User not found');
    return data;
  },

  async deleteUser(tenantId, userId) {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('User not found');
    return true;
  },

  async resetPassword(tenantId, userId, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select('id, username, email, role')
      .single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('User not found');
    return data;
  },
};

module.exports = tenantService;