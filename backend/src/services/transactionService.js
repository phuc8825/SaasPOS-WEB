const supabase = require('../config/supabase');
const emailService = require('./emailService');

const transactionService = {
  async create(tenantId, userId, {
    items, customerEmail, customerName, customerPhone,
    paymentMethod, notes, discount = 0, tax = 0
  }) {
    if (!items || items.length === 0) throw new Error('No items in transaction');

    // Get tenant for receipt
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    // Validate products belong to this tenant
    const productIds = items.map((i) => i.productId);
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, price, tenant_id')
      .in('id', productIds)
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (prodError) throw new Error(prodError.message);
    if (products.length !== productIds.length) {
      throw new Error('Một số sản phẩm không tồn tại hoặc không khả dụng');
    }

    const productMap = {};
    products.forEach((p) => { productMap[p.id] = p; });

    // Build items using server-side prices (security: never trust client price)
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

    // Generate transaction code
    const { data: codeData } = await supabase.rpc('generate_transaction_code', { tenant_uuid: tenantId });
    const transactionCode = codeData || `TXN-${Date.now()}`;

    // Insert transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        transaction_code: transactionCode,
        subtotal,
        tax: parseFloat(tax),
        discount: parseFloat(discount),
        total,
        payment_method: paymentMethod || 'cash',
        customer_email: customerEmail || null,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        notes: notes || null,
        status: 'completed',
      })
      .select()
      .single();

    if (txError) throw new Error(txError.message);

    // Insert items
    const itemsToInsert = transactionItems.map((item) => ({
      ...item,
      transaction_id: transaction.id,
    }));

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(itemsToInsert);

    if (itemsError) throw new Error(itemsError.message);

    // Fetch full transaction with items
    const fullTransaction = await this.getById(tenantId, transaction.id);

    // Send email receipt if email provided
    if (customerEmail) {
      try {
        await emailService.sendReceipt(customerEmail, fullTransaction, tenant);
        await supabase
          .from('transactions')
          .update({ receipt_sent: true })
          .eq('id', transaction.id);
        fullTransaction.receipt_sent = true;
      } catch (emailErr) {
        // Email send failed, but don't fail the transaction
      }
    }

    return fullTransaction;
  },

  async getById(tenantId, transactionId) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`*, transaction_items(*)`)
      .eq('id', transactionId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw new Error('Transaction not found');
    return data;
  },

  async getAll(tenantId, { page = 1, limit = 20, dateFrom, dateTo } = {}) {
    let query = supabase
      .from('transactions')
      .select('*, transaction_items(*)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { transactions: data, total: count, page, limit };
  },
};

module.exports = transactionService;