const bcrypt = require('bcrypt');
const db = require('../config/db');

const tenantService = {
  async getAll() {
    const query = `
      SELECT t.*, 
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', u.id, 
            'username', u.username, 
            'email', u.email, 
            'role', u.role, 
            'is_active', u.is_active
          )) 
          FROM users u 
          WHERE u.tenant_id = t.id), 
          '[]'::json
        ) as users
      FROM tenants t
      ORDER BY t.created_at DESC
    `;
    const res = await db.query(query);
    return res.rows;
  },

  async getById(tenantId) {
    const query = `
      SELECT t.*, 
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', u.id, 
            'username', u.username, 
            'email', u.email, 
            'role', u.role, 
            'is_active', u.is_active
          )) 
          FROM users u 
          WHERE u.tenant_id = t.id), 
          '[]'::json
        ) as users
      FROM tenants t
      WHERE t.id = $1
    `;
    const res = await db.query(query, [tenantId]);
    if (res.rows.length === 0) throw new Error('Tenant not found');
    return res.rows[0];
  },

  async create({ name, slug, email, phone, address, ownerUsername, ownerEmail, ownerPassword }) {
    if (!name || !ownerUsername || !ownerPassword) {
      throw new Error('Tên shop, tên đăng nhập và mật khẩu là bắt buộc');
    }

    const generatedSlug = slug || name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existingRes = await db.query('SELECT id FROM tenants WHERE slug = $1', [generatedSlug]);
    if (existingRes.rows.length > 0) throw new Error('Slug đã tồn tại, hãy dùng tên khác');

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const tenantRes = await client.query(
        'INSERT INTO tenants (name, slug, email, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, generatedSlug, email, phone, address]
      );
      const tenant = tenantRes.rows[0];

      const passwordHash = await bcrypt.hash(ownerPassword, 10);
      const userRes = await client.query(
        'INSERT INTO users (tenant_id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role',
        [tenant.id, ownerUsername, ownerEmail || email, passwordHash, 'admin']
      );
      const user = userRes.rows[0];

      await client.query('COMMIT');
      return { tenant, owner: user };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async update(tenantId, data) {
    const { name, email, phone, address, logo_url } = data;
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
    if (address !== undefined) { fields.push(`address = $${idx++}`); values.push(address); }
    if (logo_url !== undefined) { fields.push(`logo_url = $${idx++}`); values.push(logo_url); }

    if (fields.length === 0) return this.getById(tenantId);

    values.push(tenantId);
    const query = `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await db.query(query, values);
    if (res.rows.length === 0) throw new Error('Tenant not found');
    return res.rows[0];
  },

  async deleteTenant(tenantId) {
    await db.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    return true;
  },

  async getStats(tenantId) {
    const productsRes = await db.query('SELECT count(*) FROM products WHERE tenant_id = $1 AND is_active = true', [tenantId]);
    const usersRes = await db.query('SELECT count(*) FROM users WHERE tenant_id = $1 AND is_active = true', [tenantId]);
    const transactionsRes = await db.query('SELECT total FROM transactions WHERE tenant_id = $1 AND status = $2', [tenantId, 'completed']);

    const totalRevenue = (transactionsRes.rows || []).reduce((s, t) => s + parseFloat(t.total), 0);
    return {
      products: parseInt(productsRes.rows[0].count) || 0,
      users: parseInt(usersRes.rows[0].count) || 0,
      transactions: transactionsRes.rows.length,
      totalRevenue,
    };
  },

  // ---- User management ----
  async getUsers(tenantId) {
    const res = await db.query(
      'SELECT id, username, email, role, is_active, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return res.rows;
  },

  async createUser(tenantId, { username, email, password, role = 'cashier' }) {
    if (!username || !password) throw new Error('Tên đăng nhập và mật khẩu là bắt buộc');
    if (!['admin', 'cashier'].includes(role)) throw new Error('Role không hợp lệ');

    const existingRes = await db.query('SELECT id FROM users WHERE tenant_id = $1 AND username = $2', [tenantId, username]);
    if (existingRes.rows.length > 0) throw new Error('Tên đăng nhập đã tồn tại trong shop này');

    const passwordHash = await bcrypt.hash(password, 10);
    const res = await db.query(
      'INSERT INTO users (tenant_id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, is_active, created_at',
      [tenantId, username, email, passwordHash, role]
    );
    return res.rows[0];
  },

  async updateUser(tenantId, userId, { username, email, password, role, is_active }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (username !== undefined) { fields.push(`username = $${idx++}`); values.push(username); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (role !== undefined) {
      if (!['admin', 'cashier'].includes(role)) throw new Error('Role không hợp lệ');
      fields.push(`role = $${idx++}`); values.push(role);
    }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(is_active); }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      fields.push(`password_hash = $${idx++}`); values.push(passwordHash);
    }

    if (fields.length === 0) {
      const res = await db.query('SELECT id, username, email, role, is_active, created_at FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
      return res.rows[0];
    }

    values.push(userId);
    values.push(tenantId);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} AND tenant_id = $${idx + 1} RETURNING id, username, email, role, is_active, created_at`;
    const res = await db.query(query, values);
    if (res.rows.length === 0) throw new Error('User not found');
    return res.rows[0];
  },

  async deleteUser(tenantId, userId) {
    const res = await db.query('DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id', [userId, tenantId]);
    if (res.rows.length === 0) throw new Error('User not found');
    return true;
  },

  async resetPassword(tenantId, userId, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const res = await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 AND tenant_id = $3 RETURNING id, username, email, role',
      [passwordHash, userId, tenantId]
    );
    if (res.rows.length === 0) throw new Error('User not found');
    return res.rows[0];
  },
};

module.exports = tenantService;