const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Authentication middleware
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated',
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked due to failed login attempts',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

// Optional authentication - for routes that work with or without auth
const optionalAuth = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.isActive && !user.isLocked) {
        req.user = user;
      }
    } catch (error) {
      // Token invalid or expired, but continue without authentication
      req.user = null;
    }
  }

  next();
};

// Check if user owns the resource
const checkOwnership = (resourceModel) => {
  return async (req, res, next) => {
    try {
      const resource = await resourceModel.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      // Admin can access any resource
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Check ownership based on resource type
      let isOwner = false;

      if (resource.user && resource.user.toString() === req.user.id) {
        isOwner = true;
      } else if (resource.owner && resource.owner.toString() === req.user.id) {
        isOwner = true;
      }

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource',
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message,
      });
    }
  };
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = async (req, res, next) => {
  // This would typically use Redis for production
  // For now, we'll use a simple in-memory store
  const key = `sensitive_${req.ip}_${req.user?.id || 'anonymous'}`;
  
  // In production, implement proper rate limiting with Redis
  // For now, just proceed
  next();
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  checkOwnership,
  sensitiveOperationLimit,
};
