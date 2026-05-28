const db = require('../config/db');
const emailService = require('./emailService');

const transactionService = {
  async create(tenantId, userId, {
    items, customerEmail, customerName, customerPhone,
    paymentMethod, notes, discount = 0, tax = 0
  }) {
    if (!items || items.length === 0) throw new Error('No items in transaction');

    // Get tenant for receipt
    const tenantRes = await db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    const tenant = tenantRes.rows[0];
    if (!tenant) throw new Error('Tenant not found');

    // Validate products belong to this tenant
    const productIds = items.map((i) => i.productId);
    const prodRes = await db.query(
      'SELECT id, name, price, tenant_id FROM products WHERE id = ANY($1) AND tenant_id = $2 AND is_active = true',
      [productIds, tenantId]
    );
    const products = prodRes.rows;

    if (products.length !== productIds.length) {
      throw new Error('Một số sản phẩm không tồn tại hoặc không khả dụng');
    }

    const productMap = {};
    products.forEach((p) => { productMap[p.id] = p; });

    const transactionItems = items.map((item) => {
      const product = productMap[item.productId];
      const qty = parseInt(item.quantity);
      const price = parseFloat(product.price);
      return {
        product_id: item.productId,
        product_name: product.name,
        quantity: qty,
        price,
        subtotal: qty * price,
      };
    });

    const subtotal = transactionItems.reduce((sum, i) => sum + i.subtotal, 0);
    const total = Math.max(0, subtotal + parseFloat(tax) - parseFloat(discount));

    // Generate transaction code (Try RPC fallback to JS)
    let transactionCode;
    try {
      const codeRes = await db.query('SELECT generate_transaction_code($1) as code', [tenantId]);
      transactionCode = codeRes.rows[0].code;
    } catch (err) {
      transactionCode = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Insert transaction
      const txRes = await client.query(
        `INSERT INTO transactions 
        (tenant_id, user_id, transaction_code, subtotal, tax, discount, total, payment_method, customer_email, customer_name, customer_phone, notes, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
        RETURNING *`,
        [
          tenantId, userId, transactionCode, subtotal, parseFloat(tax), parseFloat(discount), 
          total, paymentMethod || 'cash', customerEmail || null, customerName || null, 
          customerPhone || null, notes || null, 'completed'
        ]
      );
      const transaction = txRes.rows[0];

      // Insert items
      for (const item of transactionItems) {
        await client.query(
          'INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
          [transaction.id, item.product_id, item.product_name, item.quantity, item.price, item.subtotal]
        );
      }

      await client.query('COMMIT');

      // Fetch full transaction with items
      const fullTransaction = await this.getById(tenantId, transaction.id);

      // Send email receipt if email provided
      if (customerEmail) {
        try {
          await emailService.sendReceipt(customerEmail, fullTransaction, tenant);
          await db.query('UPDATE transactions SET receipt_sent = true WHERE id = $1', [transaction.id]);
          fullTransaction.receipt_sent = true;
        } catch (emailErr) {
          // Email send failed, but don't fail the transaction
        }
      }

      return fullTransaction;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getById(tenantId, transactionId) {
    const query = `
      SELECT t.*, 
        COALESCE(
          (SELECT json_agg(ti) FROM transaction_items ti WHERE ti.transaction_id = t.id), 
          '[]'::json
        ) as transaction_items
      FROM transactions t
      WHERE t.id = $1 AND t.tenant_id = $2
    `;
    const res = await db.query(query, [transactionId, tenantId]);
    if (res.rows.length === 0) throw new Error('Transaction not found');
    return res.rows[0];
  },

  async getAll(tenantId, { page = 1, limit = 20, dateFrom, dateTo } = {}) {
    const values = [tenantId];
    let idx = 2;
    let where = 'WHERE tenant_id = $1';

    if (dateFrom) {
      where += ` AND created_at >= $${idx++}`;
      values.push(dateFrom);
    }
    if (dateTo) {
      where += ` AND created_at <= $${idx++}`;
      values.push(dateTo);
    }

    const countRes = await db.query(`SELECT count(*) FROM transactions ${where}`, values);
    const count = parseInt(countRes.rows[0].count);

    const offset = (page - 1) * limit;
    const query = `
      SELECT t.*, 
        COALESCE(
          (SELECT json_agg(ti) FROM transaction_items ti WHERE ti.transaction_id = t.id), 
          '[]'::json
        ) as transaction_items
      FROM transactions t
      ${where} 
      ORDER BY created_at DESC 
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    values.push(limit);
    values.push(offset);

    const res = await db.query(query, values);
    return { transactions: res.rows, total: count, page, limit };
  },
};

module.exports = transactionService;