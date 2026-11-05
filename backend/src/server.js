require('dotenv').config();
const app = require('./app');
const prisma = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ Successfully connected to MySQL database via Prisma');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Restaurant Management Server running on http://localhost:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down server gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('🔌 MySQL disconnected. Process finished.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error);
    process.exit(1);
  }
}

startServer();
