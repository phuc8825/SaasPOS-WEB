const productService = require('../services/productService');

const productController = {
  async getAll(req, res, next) {
    try {
      const { search, category, page, limit } = req.query;
      const result = await productService.getAll(req.tenantId, { search, category, page: +page || 1, limit: +limit || 50 });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const product = await productService.getById(req.tenantId, req.params.id);
      res.json({ success: true, data: product });
    } catch (err) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async create(req, res, next) {
    try {
      const { name, price, description, image_url, category, sku, stock_quantity } = req.body;
      if (!name || price === undefined) {
        return res.status(400).json({ success: false, message: 'Name and price are required' });
      }
      const product = await productService.create(req.tenantId, {
        name, price: parseFloat(price), description, image_url, category, sku, stock_quantity: +stock_quantity || 0,
      });
      res.status(201).json({ success: true, data: product });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const { name, price, description, image_url, category, sku, stock_quantity } = req.body;
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (description !== undefined) updateData.description = description;
      if (image_url !== undefined) updateData.image_url = image_url;
      if (category !== undefined) updateData.category = category;
      if (sku !== undefined) updateData.sku = sku;
      if (stock_quantity !== undefined) updateData.stock_quantity = +stock_quantity;

      const product = await productService.update(req.tenantId, req.params.id, updateData);
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await productService.delete(req.tenantId, req.params.id);
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) { next(err); }
  },

  async getCategories(req, res, next) {
    try {
      const categories = await productService.getCategories(req.tenantId);
      res.json({ success: true, data: categories });
    } catch (err) { next(err); }
  },
};

module.exports = productController;