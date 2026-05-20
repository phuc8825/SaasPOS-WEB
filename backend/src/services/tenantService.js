const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');

const tenantService = {
  // List all tenants (super admin only)
  async getAll() {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        users(id, username, email, role, is_active)
      `)
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

  // Create a new tenant + owner user in one transaction
  async create({ name, slug, email, phone, address, ownerUsername, ownerEmail, ownerPassword }) {
    if (!name || !ownerUsername || !ownerPassword) {
      throw new Error('Tên shop, tên đăng nhập và mật khẩu là bắt buộc');
    }

    // Check slug uniqueness
    const generatedSlug = slug || name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', generatedSlug)
      .single();

    if (existing) throw new Error('Slug đã tồn tại, hãy dùng tên khác');

    // Insert tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name, slug: generatedSlug, email, phone, address })
      .select()
      .single();

    if (tenantError) throw new Error(tenantError.message);

    // Hash password and create owner user
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
      // Rollback tenant if user creation failed
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
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated;
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
};

module.exports = tenantService;