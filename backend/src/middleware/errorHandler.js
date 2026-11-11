// KodiKart — Production-Safe Global Error Handler
// Handles Prisma, JWT, Validation and generic errors
// Never leaks stack traces or internals in production

const isDev = process.env.NODE_ENV === 'development';

/**
 * Map Prisma error codes to HTTP status and user-friendly messages.
 */
const PRISMA_ERROR_MAP = {
  P2002: {
    status: 409,
    getMessage: (err) => {
      const target = err.meta?.target;
      if (Array.isArray(target) && target.length) {
        const field = target[0].replace(/_/g, ' ');
        return `A record with this ${field} already exists.`;
      }
      return 'A record with this value already exists.';
    },
  },
  P2025: {
    status: 404,
    getMessage: () => 'The requested record could not be found.',
  },
  P2003: {
    status: 400,
    getMessage: (err) => {
      const field = err.meta?.field_name || 'reference';
      return `Invalid reference: the related ${field} does not exist.`;
    },
  },
  P2014: {
    status: 400,
    getMessage: () => 'The change would violate a required relation between records.',
  },
  P2000: {
    status: 400,
    getMessage: () => 'One or more values provided are too long for their field.',
  },
};

/**
 * Centralized error logger — always logs full details server-side.
 */
const logError = (err, req) => {
  const requestId = req.requestId || req.headers['x-request-id'] || 'unknown';
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';

  console.error(JSON.stringify({
    timestamp,
    requestId,
    level: 'ERROR',
    method,
    url,
    ip,
    errorName: err.name,
    errorCode: err.code,
    message: err.message,
    stack: err.stack,
    meta: err.meta,
  }));
};

/**
 * Global Express error-handling middleware.
 * Must be registered LAST in app.js: app.use(errorHandler)
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  // Always log full details server-side
  logError(err, req);

  // ── Prisma errors ──────────────────────────────────────────
  if (err.code && PRISMA_ERROR_MAP[err.code]) {
    const mapping = PRISMA_ERROR_MAP[err.code];
    return res.status(mapping.status).json({
      success: false,
      message: mapping.getMessage(err),
      requestId: req.requestId,
      ...(isDev && { dev: { code: err.code, meta: err.meta } }),
    });
  }

  // Generic Prisma client / initialization error
  if (err.name === 'PrismaClientKnownRequestError' ||
      err.name === 'PrismaClientValidationError' ||
      err.name === 'PrismaClientUnknownRequestError') {
    return res.status(500).json({
      success: false,
      message: 'A database error occurred. Please try again.',
      requestId: req.requestId,
      ...(isDev && { dev: { name: err.name, message: err.message } }),
    });
  }

  // ── JWT errors ─────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token. Please log in again.',
      requestId: req.requestId,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Session expired. Please log in again.',
      requestId: req.requestId,
    });
  }

  if (err.name === 'NotBeforeError') {
    return res.status(401).json({
      success: false,
      message: 'Token not yet active. Please try again.',
      requestId: req.requestId,
    });
  }

  // ── express-validator errors (passed via next(err) pattern) ─
  if (err.type === 'validation' || (Array.isArray(err.errors) && err.status === 400)) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: err.errors,
      requestId: req.requestId,
    });
  }

  // ── CORS errors ────────────────────────────────────────────
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({
      success: false,
      message: 'Request origin not permitted.',
      requestId: req.requestId,
    });
  }

  // ── SyntaxError from body-parser (malformed JSON) ──────────
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body.',
      requestId: req.requestId,
    });
  }

  // ── Generic HTTP errors with explicit statusCode ───────────
  const statusCode = err.statusCode || err.status || 500;

  // In production: never leak internal error details
  const clientMessage = !isDev && statusCode === 500
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message: clientMessage,
    requestId: req.requestId,
    // Development-only extras
    ...(isDev && statusCode === 500 && {
      dev: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
    }),
  });
};

module.exports = errorHandler;
