const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('   Full-Stack Production Build for Cloud Deployment  ');
console.log('====================================================\n');

try {
  console.log('[1/2] Installing backend dependencies & generating Prisma Client...');
  execSync('npm install --include=dev && npx prisma generate', {
    cwd: path.join(root, 'backend'),
    stdio: 'inherit'
  });

  console.log('\n[2/2] Installing frontend dependencies & building React production bundle...');
  execSync('npm install --include=dev && npm run build', {
    cwd: path.join(root, 'frontend'),
    stdio: 'inherit'
  });

  console.log('\n====================================================');
  console.log('✅ Full-stack build completed successfully!');
  console.log('   Frontend bundle is ready at frontend/dist');
  console.log('====================================================\n');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
