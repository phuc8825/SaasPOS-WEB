const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is active
    const { data: user, error } = await supabase
      .from('users')
      .select('id, tenant_id, username, role, is_active')
      .eq('id', decoded.userId)
      .eq('tenant_id', decoded.tenantId)
      .single();

    if (error || !user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    req.user = {
      userId: user.id,
      tenantId: user.tenant_id,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    next(err);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authMiddleware, requireRole };

const superAdminMiddleware = (req, res, next) => {
  const key = req.headers['x-super-admin-key'];
  if (!key || key !== process.env.SUPER_ADMIN_KEY) {
    return res.status(403).json({ success: false, message: 'Super admin access required' });
  }
  next();
};

module.exports = { authMiddleware, requireRole, superAdminMiddleware };