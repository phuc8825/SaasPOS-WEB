const supabase = require('../config/supabase');

const productService = {
  async getAll(tenantId, { search, category, page = 1, limit = 50 } = {}) {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { products: data, total: count, page, limit };
  },

  async getById(tenantId, productId) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw new Error('Product not found');
    return data;
  },

  async create(tenantId, productData) {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...productData, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async update(tenantId, productId, productData) {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Product not found');
    return data;
  },

  async delete(tenantId, productId) {
    // Soft delete
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Product not found');
    return true;
  },

  async getCategories(tenantId) {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .not('category', 'is', null);

    if (error) throw new Error(error.message);
    const categories = [...new Set(data.map((p) => p.category).filter(Boolean))];
    return categories;
  },
};

module.exports = productService;