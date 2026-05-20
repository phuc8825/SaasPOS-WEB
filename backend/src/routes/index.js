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
const adminOnly = [...protect, requireRole('manager', 'cashier', 'admin')]; // giữ tương thích
// Managers (and admins) can manage staff and products. Include 'admin' role for broader permissions.
const managerOnly = [...protect, requireRole('manager', 'admin')];

// Super admin routes — dùng X-Super-Admin-Key header CHỈNH sức, KHÔNG cần JWT
const superAdminProtect = [superAdminMiddleware];

// ---- AUTH ----
router.post('/auth/login', authController.login);
router.get('/auth/me', authMiddleware, authController.me);
router.put('/auth/password', authMiddleware, authController.changePassword);

// ---- PRODUCTS ----
router.get('/products', ...protect, productController.getAll);
router.get('/products/categories', ...protect, productController.getCategories);
router.get('/products/:id', ...protect, productController.getById);
router.post('/products', ...managerOnly, productController.create);
router.put('/products/:id', ...managerOnly, productController.update);
router.delete('/products/:id', ...managerOnly, productController.delete);

// ---- TRANSACTIONS ----
router.post('/transactions', ...protect, transactionController.create);
router.get('/transactions', ...protect, transactionController.getAll);
router.get('/transactions/:id', ...protect, transactionController.getById);

// ---- DASHBOARD ----
router.get('/dashboard/stats', ...protect, dashboardController.getStats);
router.get('/dashboard/recent', ...protect, dashboardController.getRecentTransactions);

// ---- SUPER ADMIN: TENANT MANAGEMENT ----
router.get('/admin/tenants', ...superAdminProtect, tenantController.getAll);
router.get('/admin/tenants/:id', ...superAdminProtect, tenantController.getById);
router.post('/admin/tenants', ...superAdminProtect, tenantController.create);
router.put('/admin/tenants/:id', ...superAdminProtect, tenantController.update);
router.delete('/admin/tenants/:id', ...superAdminProtect, tenantController.deleteTenant);
router.get('/admin/tenants/:id/stats', ...superAdminProtect, tenantController.getStats);

// ---- SUPER ADMIN: QUẢN LÝ USER CỦA TENANT ----
router.get('/admin/tenants/:id/users', ...superAdminProtect, tenantController.getUsers);
router.post('/admin/tenants/:id/users', ...superAdminProtect, tenantController.createUser);
router.put('/admin/tenants/:tenantId/users/:userId', ...superAdminProtect, tenantController.updateUser);
router.delete('/admin/tenants/:tenantId/users/:userId', ...superAdminProtect, tenantController.deleteUser);

// ---- STAFF MANAGEMENT FOR TENANT (MANAGER / CASHIER) ----
// Managers can view, create, update, delete staff of their own tenant.
// Cashiers can only view the list.
router.get('/tenants/:id/users', ...protect, tenantController.getUsers);
router.post('/tenants/:id/users', ...managerOnly, tenantController.createUser);
router.put('/tenants/:tenantId/users/:userId', ...managerOnly, tenantController.updateUser);
router.put('/tenants/:tenantId/users/:userId/password', ...managerOnly, tenantController.resetPassword);
router.delete('/tenants/:tenantId/users/:userId', ...managerOnly, tenantController.deleteUser);

module.exports = router;