const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

function checkProductionReadiness() {
  console.log('🔍 Production Readiness Check');
  console.log('================================\n');
  
  const checks = [];
  
  // 1. Check environment variables
  console.log('1. Environment Variables:');
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`   ✓ ${envVar} is set`);
      checks.push({ name: envVar, status: 'pass' });
    } else {
      console.log(`   ❌ ${envVar} is missing`);
      checks.push({ name: envVar, status: 'fail' });
    }
  });
  
  // 2. Check package.json scripts
  console.log('\n2. Package.json Scripts:');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = ['start', 'build', 'start:prod'];
    
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        console.log(`   ✓ ${script} script exists`);
        checks.push({ name: `script-${script}`, status: 'pass' });
      } else {
        console.log(`   ❌ ${script} script missing`);
        checks.push({ name: `script-${script}`, status: 'fail' });
      }
    });
  } catch (error) {
    console.log('   ❌ Cannot read package.json');
    checks.push({ name: 'package-json', status: 'fail' });
  }
  
  // 3. Check critical files
  console.log('\n3. Critical Files:');
  const criticalFiles = [
    'src/main.ts',
    'prisma/schema.prisma',
    '.env',
    'tsconfig.json'
  ];
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✓ ${file} exists`);
      checks.push({ name: `file-${file}`, status: 'pass' });
    } else {
      console.log(`   ❌ ${file} missing`);
      checks.push({ name: `file-${file}`, status: 'fail' });
    }
  });
  
  // 4. Check dependencies
  console.log('\n4. Dependencies:');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const criticalDeps = ['@nestjs/core', '@prisma/client', 'bcrypt', '@nestjs/jwt'];
    
    criticalDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        console.log(`   ✓ ${dep} installed`);
        checks.push({ name: `dep-${dep}`, status: 'pass' });
      } else {
        console.log(`   ❌ ${dep} missing`);
        checks.push({ name: `dep-${dep}`, status: 'fail' });
      }
    });
  } catch (error) {
    console.log('   ❌ Cannot check dependencies');
  }
  
  // 5. Security checks
  console.log('\n5. Security Configuration:');
  
  // Check if JWT_SECRET is strong enough
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length >= 32) {
    console.log('   ✓ JWT_SECRET is sufficiently long');
    checks.push({ name: 'jwt-security', status: 'pass' });
  } else {
    console.log('   ❌ JWT_SECRET should be at least 32 characters');
    checks.push({ name: 'jwt-security', status: 'fail' });
  }
  
  // Check for CORS configuration
  try {
    const mainTs = fs.readFileSync('src/main.ts', 'utf8');
    if (mainTs.includes('enableCors')) {
      console.log('   ✓ CORS is configured');
      checks.push({ name: 'cors-config', status: 'pass' });
    } else {
      console.log('   ⚠ CORS configuration not found');
      checks.push({ name: 'cors-config', status: 'warn' });
    }
  } catch (error) {
    console.log('   ❌ Cannot check CORS configuration');
  }
  
  // Summary
  console.log('\n📊 Summary:');
  const passed = checks.filter(c => c.status === 'pass').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  const warnings = checks.filter(c => c.status === 'warn').length;
  
  console.log(`   ✓ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⚠ Warnings: ${warnings}`);
  
  if (failed === 0) {
    console.log('\n🎉 System is ready for production!');
  } else {
    console.log('\n⚠ Please address the failed checks before deploying to production.');
  }
  
  return { passed, failed, warnings, checks };
}

// Run the check
checkProductionReadiness();