/**
 * Weather Image API Main Server
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

// Only load dotenv in development (Render uses dashboard env vars)
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const connectDB = require('./config/db');
const { startCronJobs } = require('./services/cronService');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Connect to Database
connectDB();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Log requests in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`[Request] ${req.method} ${req.url}`);
        next();
    });
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Start Cron (currently disabled)
startCronJobs();

// Health check
app.get('/', (req, res) => {
    res.send('Weather Image API is running.\nEndpoints:\nPOST /api/auth/register\nPOST /api/auth/login\nGET /api/users/widget-image\nPUT /api/users/city');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
