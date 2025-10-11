require('dotenv').config();


const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Route files
const auth = require('./routes/auth');
const vehicles = require('./routes/vehicles');
const reservations = require('./routes/reservations');
const admin = require('./routes/admin');

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enable CORS
app.use(cors());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', auth);
app.use('/api/vehicles', vehicles);
app.use('/api/reservations', reservations);
app.use('/api/admin', admin);

// Error handler middleware
app.use(errorHandler);

module.exports = app;