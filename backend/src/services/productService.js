const db = require('../config/db');

const productService = {
  async getAll(tenantId, { search, category, page = 1, limit = 50 } = {}) {
    const values = [tenantId];
    let idx = 2;
    let where = 'WHERE tenant_id = $1 AND is_active = true';

    if (search) {
      where += ` AND name ILIKE $${idx++}`;
      values.push(`%${search}%`);
    }
    if (category) {
      where += ` AND category = $${idx++}`;
      values.push(category);
    }

    const countRes = await db.query(`SELECT count(*) FROM products ${where}`, values);
    const count = parseInt(countRes.rows[0].count);

    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM products 
      ${where} 
      ORDER BY name 
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    values.push(limit);
    values.push(offset);

    const res = await db.query(query, values);
    return { products: res.rows, total: count, page, limit };
  },

  async getById(tenantId, productId) {
    const res = await db.query(
      'SELECT * FROM products WHERE id = $1 AND tenant_id = $2',
      [productId, tenantId]
    );
    if (res.rows.length === 0) throw new Error('Product not found');
    return res.rows[0];
  },

  async create(tenantId, productData) {
    const { name, description, price, category, stock_quantity, image_url } = productData;
    const res = await db.query(
      'INSERT INTO products (tenant_id, name, description, price, category, stock_quantity, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [tenantId, name, description, price, category, stock_quantity, image_url]
    );
    return res.rows[0];
  },

  async update(tenantId, productId, productData) {
    const { name, description, price, category, stock_quantity, image_url, is_active } = productData;
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (price !== undefined) { fields.push(`price = $${idx++}`); values.push(price); }
    if (category !== undefined) { fields.push(`category = $${idx++}`); values.push(category); }
    if (stock_quantity !== undefined) { fields.push(`stock_quantity = $${idx++}`); values.push(stock_quantity); }
    if (image_url !== undefined) { fields.push(`image_url = $${idx++}`); values.push(image_url); }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(is_active); }

    if (fields.length === 0) return this.getById(tenantId, productId);

    values.push(productId);
    values.push(tenantId);
    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} AND tenant_id = $${idx + 1} RETURNING *`;
    const res = await db.query(query, values);
    if (res.rows.length === 0) throw new Error('Product not found');
    return res.rows[0];
  },

  async delete(tenantId, productId) {
    // Soft delete
    const res = await db.query(
      'UPDATE products SET is_active = false WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [productId, tenantId]
    );
    if (res.rows.length === 0) throw new Error('Product not found');
    return true;
  },

  async getCategories(tenantId) {
    const res = await db.query(
      'SELECT DISTINCT category FROM products WHERE tenant_id = $1 AND is_active = true AND category IS NOT NULL',
      [tenantId]
    );
    return res.rows.map((r) => r.category);
  },
};

module.exports = productService;