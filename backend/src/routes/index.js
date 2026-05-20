const express = require('express');
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const transactionController = require('../controllers/transactionController');
const dashboardController = require('../controllers/dashboardController');
const tenantController = require('../controllers/tenantController');
const { authMiddleware, requireRole, superAdminMiddleware } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

const router = express.Router();
const protect = [authMiddleware, tenantMiddleware];
const adminOnly = [...protect, requireRole('admin', 'manager')];
const superAdmin = [superAdminMiddleware];

// ---- AUTH ----
router.post('/auth/login', authController.login);
router.get('/auth/me', ...protect, authController.me);
router.put('/auth/password', ...protect, authController.changePassword);

// ---- PRODUCTS ----
router.get('/products', ...protect, productController.getAll);
router.get('/products/categories', ...protect, productController.getCategories);
router.get('/products/:id', ...protect, productController.getById);
router.post('/products', ...adminOnly, productController.create);
router.put('/products/:id', ...adminOnly, productController.update);
router.delete('/products/:id', ...adminOnly, productController.delete);

// ---- TRANSACTIONS ----
router.post('/transactions', ...protect, transactionController.create);
router.get('/transactions', ...protect, transactionController.getAll);
router.get('/transactions/:id', ...protect, transactionController.getById);

// ---- DASHBOARD ----
router.get('/dashboard/stats', ...protect, dashboardController.getStats);
router.get('/dashboard/recent', ...protect, dashboardController.getRecentTransactions);

// ---- SUPER ADMIN: TENANT MANAGEMENT ----
router.get('/admin/tenants', ...superAdmin, tenantController.getAll);
router.get('/admin/tenants/:id', ...superAdmin, tenantController.getById);
router.post('/admin/tenants', ...superAdmin, tenantController.create);
router.put('/admin/tenants/:id', ...superAdmin, tenantController.update);
router.get('/admin/tenants/:id/stats', ...superAdmin, tenantController.getStats);

module.exports = router;