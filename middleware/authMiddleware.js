const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Check if token is blacklisted
      const isBlacklisted = await TokenBlacklist.findOne({ token });
      if (isBlacklisted) {
        return res.status(401).json({ message: 'Token has been revoked. Please login again.' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

      // Get user from the token (use lean() to avoid N+1)
      req.user = await User.findById(decoded.id).select('-password').lean();

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
