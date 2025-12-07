const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Prisma Client generation...');

const prismaPaths = [
  path.join(__dirname, '../../node_modules/.prisma'),
  path.join(__dirname, '../node_modules/.prisma'),
  path.join(__dirname, '../../node_modules/@prisma/client'),
];

console.log('🗑️  Removing old Prisma Client files...');
prismaPaths.forEach((prismaPath) => {
  if (fs.existsSync(prismaPath)) {
    try {
      // Try to remove files individually first
      const removeDir = (dir) => {
        if (fs.existsSync(dir)) {
          fs.readdirSync(dir).forEach((file) => {
            const curPath = path.join(dir, file);
            try {
              if (fs.lstatSync(curPath).isDirectory()) {
                removeDir(curPath);
              } else {
                fs.unlinkSync(curPath);
              }
            } catch (err) {
              // Ignore errors for locked files
              console.warn(`   ⚠️  Could not remove ${curPath}, continuing...`);
            }
          });
          try {
            fs.rmdirSync(dir);
          } catch (err) {
            // Ignore if directory not empty
          }
        }
      };
      removeDir(prismaPath);
      console.log(`   ✅ Removed ${prismaPath}`);
    } catch (error) {
      console.warn(`   ⚠️  Could not fully remove ${prismaPath}: ${error.message}`);
    }
  }
});

console.log('\n📦 Regenerating Prisma Client...');
try {
  execSync('npm run prisma:generate', { 
    stdio: 'inherit', 
    cwd: path.join(__dirname, '..'),
    timeout: 60000 
  });
  console.log('\n✅ Prisma Client generated successfully!');
} catch (error) {
  console.error('\n❌ Failed to generate Prisma Client:', error.message);
  console.log('\n💡 Try these solutions:');
  console.log('   1. Close all terminals and Node.js processes');
  console.log('   2. Run this script as Administrator');
  console.log('   3. Disable antivirus temporarily');
  console.log('   4. Restart your computer');
  process.exit(1);
}

