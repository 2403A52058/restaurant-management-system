// KodiKart — Main Express Application
// Live Native Hens Marketplace | Built for ₹0 deployment

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const farmRoutes = require('./routes/farmRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const socialRoutes = require('./routes/socialRoutes');
const henController = require('./controllers/henController');

const app = express();

// ============================================================
// SECURITY HEADERS (Helmet)
// ============================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Tighten after CSP audit
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'res.cloudinary.com'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ============================================================
// CORS — Strict origin restriction
// ============================================================
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://kodikart.pages.dev',
  'https://www.kodikart.pages.dev',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman in dev)
    if (!origin || process.env.NODE_ENV === 'development') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================================
// BODY PARSERS
// ============================================================
// Raw body needed for PhonePe webhook signature verification
app.use('/api/payments/phonepe-webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ============================================================
// GLOBAL RATE LIMITER
// ============================================================
app.use('/api', apiLimiter);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'KodiKart API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    timezone: 'Asia/Kolkata',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/breeds', (req, res, next) => henController.listBreeds(req, res, next));
app.use('/api/hens', farmRoutes);
app.use('/api/farm-breeds', farmRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', socialRoutes); // /api/reviews, /api/complaints, /api/notifications

// ============================================================
// SERVE FRONTEND STATIC FILES (Production)
// ============================================================
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath, {
  // Cache static assets aggressively, but not index.html
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).json({ success: false, message: 'Resource not found.' });
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use(errorHandler);

module.exports = app;
