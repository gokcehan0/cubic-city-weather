const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    // index is defined below with TTL
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Auto-delete expired tokens (TTL index)
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
