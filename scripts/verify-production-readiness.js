const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../ai-outbound-dashboard/.env') });

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Helper function to run commands
function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to log with colors
function log(message, type = 'info') {
  const color = type === 'error' ? colors.red : 
                type === 'success' ? colors.green : 
                type === 'warning' ? colors.yellow : 
                colors.blue;
  console.log(`${color}${message}${colors.reset}`);
}

// Main verification function
async function verifyProductionReadiness() {
  log('\n🔍 Starting Production Readiness Verification\n', 'info');
  
  // 1. Check environment variables
  log('\n📋 Checking Environment Variables...', 'info');
  const requiredEnvVars = ['OPENAI_API_KEY', 'NODE_ENV'];
  const optionalEnvVars = ['HUBSPOT_API_KEY'];
  
  const missingRequired = requiredEnvVars.filter(env => !process.env[env]);
  const missingOptional = optionalEnvVars.filter(env => !process.env[env]);
  
  if (missingRequired.length > 0) {
    log(`❌ Missing required environment variables: ${missingRequired.join(', ')}`, 'error');
    process.exit(1);
  }
  
  if (missingOptional.length > 0) {
    log(`⚠️ Missing optional environment variables: ${missingOptional.join(', ')}`, 'warning');
  } else {
    log('✅ All environment variables are set', 'success');
  }
  
  // 2. Run linting
  log('\n📋 Running Linting...', 'info');
  if (runCommand('npm run lint')) {
    log('✅ Linting passed', 'success');
  } else {
    log('❌ Linting failed', 'error');
    process.exit(1);
  }
  
  // 3. Run tests
  log('\n📋 Running Tests...', 'info');
  if (runCommand('npm test')) {
    log('✅ Tests passed', 'success');
  } else {
    log('❌ Tests failed', 'error');
    process.exit(1);
  }
  
  // 4. Check build
  log('\n📋 Building Project...', 'info');
  if (runCommand('npm run build')) {
    log('✅ Build successful', 'success');
  } else {
    log('❌ Build failed', 'error');
    process.exit(1);
  }
  
  // 5. Verify file structure
  log('\n📋 Verifying Project Structure...', 'info');
  const requiredDirs = [
    'src/app/api',
    'src/components',
    'src/lib',
    'src/types',
    'src/tests',
    'public'
  ];
  
  const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));
  if (missingDirs.length > 0) {
    log(`❌ Missing required directories: ${missingDirs.join(', ')}`, 'error');
    process.exit(1);
  }
  log('✅ Project structure verified', 'success');
  
  // 6. Check for critical files
  log('\n📋 Checking Critical Files...', 'info');
  const criticalFiles = [
    'README.md',
    'LICENSE',
    '.env.example',
    'next.config.js',
    'package.json',
    'tsconfig.json'
  ];
  
  const missingFiles = criticalFiles.filter(file => !fs.existsSync(file));
  if (missingFiles.length > 0) {
    log(`❌ Missing critical files: ${missingFiles.join(', ')}`, 'error');
    process.exit(1);
  }
  log('✅ All critical files present', 'success');
  
  // Final success message
  log('\n✨ Production Readiness Verification Complete!', 'success');
  log('The project is ready for production deployment.', 'success');
  log('\nNext steps:', 'info');
  log('1. Review the deployment checklist in README.md', 'info');
  log('2. Set up monitoring and logging', 'info');
  log('3. Configure production environment variables', 'info');
  log('4. Deploy to production environment', 'info');
}

// Run the verification
verifyProductionReadiness().catch(error => {
  log(`\n❌ Verification failed: ${error.message}`, 'error');
  process.exit(1);
}); 