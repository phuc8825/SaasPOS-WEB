// Tenant isolation middleware
// Ensures all queries are scoped to the authenticated user's tenant

const tenantMiddleware = (req, res, next) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(401).json({ success: false, message: 'Tenant context missing' });
  }
  // Inject tenantId into request for use in controllers
  req.tenantId = req.user.tenantId;
  next();
};

module.exports = tenantMiddleware;