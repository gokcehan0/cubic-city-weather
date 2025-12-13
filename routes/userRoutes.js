const express = require('express');
const router = express.Router();
const { getMe, updateCity, getWidgetData, searchCities } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMe);
router.put('/city', protect, updateCity);
router.get('/widget-image', protect, getWidgetData); // Widget calls this
router.get('/search-city', protect, searchCities);

module.exports = router;
