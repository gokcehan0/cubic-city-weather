const mongoose = require('mongoose');

const cityImageSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    unique: true, // One image per city forever
    index: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  weatherData: {
    type: Object, // Store weather snapshot for reference
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('CityImage', cityImageSchema);
