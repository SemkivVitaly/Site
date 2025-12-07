const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting deployment process...');

try {
  console.log('📦 Generating Prisma client...');
  execSync('npm run prisma:generate', { stdio: 'inherit', cwd: __dirname + '/..' });

  console.log('🔨 Building TypeScript...');
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname + '/..' });

  console.log('🗄️  Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.warn('⚠️  Migrations failed or not needed, continuing...');
  }

  console.log('🚀 Starting server...');
  execSync('npm run start', { stdio: 'inherit', cwd: __dirname + '/..' });
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}

