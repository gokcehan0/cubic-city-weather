const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

// Decode token to get expiry
const getTokenExpiry = (token) => {
  try {
    const decoded = jwt.decode(token);
    return new Date(decoded.exp * 1000);
  } catch {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days fallback
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password, city } = req.body;

    if (!username || !email || !password || !city) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // Check if user exists (single query, no N+1)
    const userExists = await User.findOne({ $or: [{ email }, { username }] }).lean();

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      city: city.trim(),
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        city: user.city,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email (lean for performance)
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        city: user.city,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Logout user (blacklist token)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    // Add token to blacklist
    await TokenBlacklist.create({
      token,
      userId: req.user._id,
      expiresAt: getTokenExpiry(token),
    });

    console.log(`[Logout] Token blacklisted for user: ${req.user.username}`);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
};
