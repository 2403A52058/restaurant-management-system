const { PrismaClient } = require('@prisma/client');

// Auto-correct: If DATABASE_URL inadvertently ends with /sys (MySQL system DB),
// automatically redirect to /test where all 15 tables and 34 dishes are seeded.
let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.includes('/sys?')) {
  dbUrl = dbUrl.replace('/sys?', '/test?');
  process.env.DATABASE_URL = dbUrl;
} else if (dbUrl.endsWith('/sys')) {
  dbUrl = dbUrl.replace(/\/sys$/, '/test');
  process.env.DATABASE_URL = dbUrl;
}

const prisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
