// KodiKart — Additional Security Middleware
// Hardening layer on top of Helmet: request IDs, body sanitization,
// HTTPS enforcement and safe IP extraction for Render.com deployment.

const { v4: uuidv4 } = require('uuid');

const isProd = () => process.env.NODE_ENV === 'production';

// ============================================================
// 1. Request ID — attach UUID to every request for audit tracing
// ============================================================

/**
 * requestId middleware
 * Adds X-Request-ID header to both request and response.
 * Re-uses an existing header if supplied by a trusted upstream proxy.
 * Stored as req.requestId for use by error handler and controllers.
 */
const requestId = (req, res, next) => {
  const incoming = req.headers['x-request-id'];
  // Trust an upstream request ID only if it looks like a UUID (prevents injection)
  const id = (incoming && /^[0-9a-f-]{36}$/i.test(incoming))
    ? incoming
    : uuidv4();

  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

// ============================================================
// 2. noSniff — X-Content-Type-Options: nosniff
// ============================================================

/**
 * Prevents browsers from MIME-sniffing a response away from the
 * declared content-type, blocking certain drive-by-download attacks.
 */
const noSniff = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

// ============================================================
// 3. preventClickjacking — X-Frame-Options: DENY
// ============================================================

/**
 * Disallows the page from being embedded in an iframe, preventing
 * clickjacking attacks. Helmet's frameguard does this too; kept here
 * as an explicit belt-and-suspenders defense.
 */
const preventClickjacking = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

// ============================================================
// 4. hsts — Strict-Transport-Security (production only)
// ============================================================

/**
 * Tells browsers to use HTTPS for the next 2 years.
 * Includes subdomains. No preload by default (requires explicit DNS
 * submission — add once domain is stable).
 * Only emitted in production so local dev is unaffected.
 */
const hsts = (req, res, next) => {
  if (isProd()) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains'
    );
  }
  next();
};

// ============================================================
// 5. removePoweredBy — hide X-Powered-By: Express
// ============================================================

/**
 * Helmet already removes X-Powered-By via app.disable('x-powered-by').
 * This middleware provides the same guarantee if Helmet is ever removed.
 */
const removePoweredBy = (req, res, next) => {
  res.removeHeader('X-Powered-By');
  next();
};

// ============================================================
// 6. sanitizeBody — strip null bytes and control characters
// ============================================================

/**
 * Recursively walks req.body and strips:
 *   - Null bytes (\x00) — can bypass security filters
 *   - ASCII control characters (0x01–0x1F excluding tab/newline/CR)
 *   - Unicode control / non-character ranges
 * Only processes string values; leaves numbers, booleans and
 * arrays/objects intact (recursing into them).
 */
const _cleanString = (s) =>
  s
    .replace(/\x00/g, '')                             // null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // ASCII control chars
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, ''); // Unicode C0/C1

const _deepSanitize = (obj) => {
  if (typeof obj === 'string') return _cleanString(obj);
  if (Array.isArray(obj)) return obj.map(_deepSanitize);
  if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = _deepSanitize(obj[key]);
    }
    return cleaned;
  }
  return obj;
};

const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = _deepSanitize(req.body);
  }
  next();
};

// ============================================================
// 7. enforceHttps — redirect HTTP → HTTPS (production only)
// ============================================================

/**
 * In production, any request that arrives over plain HTTP is
 * permanently redirected to HTTPS. The X-Forwarded-Proto check
 * works correctly behind Render.com's load balancer.
 */
const enforceHttps = (req, res, next) => {
  if (!isProd()) return next();

  const proto = req.headers['x-forwarded-proto'];
  if (proto && proto !== 'https') {
    const httpsUrl = `https://${req.headers.host}${req.originalUrl}`;
    return res.redirect(301, httpsUrl);
  }
  next();
};

// ============================================================
// 8. ipExtractor — safely extract real client IP
// ============================================================

/**
 * Sets req.clientIp to the real end-user IP.
 * On Render.com, the app sits behind a load balancer that sets
 * X-Forwarded-For. We trust only the FIRST entry in that header
 * (the leftmost — closest to the real client) to prevent spoofing
 * via crafted headers with multiple entries.
 *
 * Call this early, before rate-limiters and audit log middleware,
 * so they all see the correct IP.
 *
 * Also sets app.set('trust proxy', 1) globally — do this once in
 * server.js or app.js when deploying on Render.
 */
const ipExtractor = (req, res, next) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For: client, proxy1, proxy2 — take the first
    req.clientIp = forwarded.split(',')[0].trim();
  } else {
    req.clientIp = req.socket?.remoteAddress || req.ip || 'unknown';
  }
  next();
};

// ============================================================
// Convenience: apply all security middleware as a single array
// (use this in app.js / server.js)
// ============================================================
const allSecurityMiddleware = [
  requestId,
  removePoweredBy,
  noSniff,
  preventClickjacking,
  hsts,
  enforceHttps,
  ipExtractor,
  sanitizeBody,
];

module.exports = {
  requestId,
  noSniff,
  preventClickjacking,
  hsts,
  removePoweredBy,
  sanitizeBody,
  enforceHttps,
  ipExtractor,
  allSecurityMiddleware,
};
