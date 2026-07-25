const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const walletRoutes = require('./routes/walletRoutes');
const loanRoutes = require('./routes/loanRoutes');
const reportRoutes = require('./routes/reportRoutes');
const recurringRoutes = require('./routes/recurringRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const goalRoutes = require('./routes/goalRoutes');

const app = express();

// Security Headers
app.use(helmet());

// Strict CORS locked to frontend origin with credentials enabled for httpOnly cookies
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parsers
app.use(express.json());
app.use(cookieParser());

// Connect Database
connectDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/wallets', walletRoutes);
app.use('/loans', loanRoutes);
app.use('/reports', reportRoutes);
app.use('/recurring', recurringRoutes);
app.use('/budgets', budgetRoutes);
app.use('/goals', goalRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`WalletWise backend running on port ${PORT}`);
});
