const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting deployment process...');
console.log('📋 Environment check:');
console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '⚠️  Missing'}`);
console.log(`   - FRONTEND_URL: ${process.env.FRONTEND_URL || '⚠️  Using default'}`);
console.log(`   - PORT: ${process.env.PORT || '5000 (default)'}`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development (default)'}`);

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is required!');
  console.error('Please set DATABASE_URL in your platform settings.');
  process.exit(1);
}

try {
  console.log('\n📦 Generating Prisma client...');
  execSync('npm run prisma:generate', { stdio: 'inherit', cwd: __dirname + '/..' });

  console.log('\n🔨 Building TypeScript...');
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname + '/..' });

  console.log('\n🗄️  Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.warn('⚠️  Migrations failed or not needed, continuing...');
    console.warn('   This is normal if migrations have already been applied.');
  }

  console.log('\n🚀 Starting server...');
  execSync('npm run start', { stdio: 'inherit', cwd: __dirname + '/..' });
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
}

