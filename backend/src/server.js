// KodiKart — Production-Ready Server Entry Point
// Loads env, validates required config, starts HTTP server,
// handles graceful shutdown and unhandled promise rejections.

// ── 1. Load environment variables FIRST (before any other import) ──
require('dotenv').config();

// ── 2. Required modules ──
const http = require('http');
const prisma = require('./config/db');
const app = require('./app');

// ============================================================
// ENV VALIDATION — crash early if critical config is missing
// ============================================================

const ENV = process.env.NODE_ENV || 'development';
const isProd = ENV === 'production';

/**
 * Validate environment variables on startup.
 * In production: crash immediately for missing/weak required vars.
 * In development: warn but continue.
 */
function validateEnv() {
  const errors = [];
  const warnings = [];

  // ── Required in ALL environments ──
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is not set. A PostgreSQL connection string is required.');
  }

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is not set. A secret key is required for authentication.');
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push(
      `JWT_SECRET is too short (${process.env.JWT_SECRET.length} chars). ` +
      'Minimum 32 characters required to ensure security.'
    );
  }

  // ── Optional — warn if absent ──
  if (!process.env.RESEND_API_KEY) {
    warnings.push('RESEND_API_KEY is not set. OTP emails will be printed to console instead.');
  }
  if (!process.env.PHONEPE_MERCHANT_ID) {
    warnings.push('PHONEPE_MERCHANT_ID is not set. PhonePe payment integration will be disabled.');
  }
  if (!process.env.PHONEPE_SALT_KEY) {
    warnings.push('PHONEPE_SALT_KEY is not set. PhonePe webhook signature verification will fail.');
  }

  // Print warnings
  if (warnings.length) {
    warnings.forEach((w) => console.warn(`[WARN] ${w}`));
  }

  // Handle errors
  if (errors.length) {
    errors.forEach((e) => console.error(`[FATAL] ${e}`));
    if (isProd) {
      // In production: hard crash — never start with broken config
      console.error('[FATAL] Server will not start with invalid configuration in production.');
      process.exit(1);
    } else {
      // In development: warn and continue so dev can iterate quickly
      console.warn('[WARN] Running in development mode with missing/invalid config (see above).');
      console.warn('[WARN] Fix before deploying to production.');
    }
  }
}

// ============================================================
// UNHANDLED ERRORS — catch-all safety net
// ============================================================

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });
  // Exit with failure — supervisor/Render.com will restart
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Unhandled Promise Rejection:', {
    reason: reason instanceof Error ? { name: reason.name, message: reason.message, stack: reason.stack } : reason,
    promise: String(promise),
    timestamp: new Date().toISOString(),
  });
  // Do not crash on unhandled rejections unless in production;
  // allows dev to surface bugs without killing the server immediately.
  if (isProd) {
    process.exit(1);
  }
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

let server; // Assigned after http.createServer

/**
 * Gracefully shut down the server:
 *   1. Stop accepting new connections
 *   2. Disconnect Prisma
 *   3. Exit
 */
async function shutdown(signal) {
  console.log(`\n[INFO] Received ${signal}. Shutting down gracefully…`);

  const forceExitTimeout = setTimeout(() => {
    console.error('[FATAL] Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10_000); // 10 s hard limit

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      console.log('[INFO] HTTP server closed.');
    }

    await prisma.$disconnect();
    console.log('[INFO] Prisma disconnected.');

    clearTimeout(forceExitTimeout);
    console.log('[INFO] Shutdown complete. Goodbye.');
    process.exit(0);
  } catch (err) {
    console.error('[ERROR] Error during shutdown:', err.message);
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ============================================================
// STARTUP
// ============================================================

async function start() {
  // Step 1 — Validate env
  validateEnv();

  // Step 2 — Verify DB connection
  try {
    await prisma.$connect();
    console.log('[INFO] ✅ PostgreSQL connected via Prisma.');
  } catch (err) {
    console.error('[FATAL] Failed to connect to PostgreSQL:', err.message);
    if (isProd) {
      process.exit(1);
    } else {
      console.warn('[WARN] DB connection failed; continuing in development mode without DB.');
    }
  }

  // Step 3 — Create and start HTTP server
  const PORT = parseInt(process.env.PORT || '5000', 10);

  server = http.createServer(app);

  server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║           🐔 KodiKart API Server              ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`  Environment : ${ENV}`);
    console.log(`  Port        : ${PORT}`);
    console.log(`  DB          : PostgreSQL (Prisma)`);
    console.log(`  Node        : ${process.version}`);
    console.log(`  PID         : ${process.pid}`);
    console.log(`  Started at  : ${new Date().toISOString()}`);
    console.log('');
    console.log(`  Health check: http://localhost:${PORT}/api/health`);
    console.log('');
  });

  // Surface TCP-level errors (e.g. EADDRINUSE)
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[FATAL] Port ${PORT} is already in use. Choose a different PORT.`);
    } else {
      console.error('[FATAL] Server error:', err.message);
    }
    process.exit(1);
  });
}

start();
