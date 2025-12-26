#!/usr/bin/env node

/**
 * Install Security Dependencies
 * 
 * This script installs all the new security-related dependencies
 * and provides setup instructions.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔐 Installing Security Dependencies...\n')

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: No package.json found. Please run this script from the project root.')
  process.exit(1)
}

try {
  // Install new dependencies
  console.log('📦 Installing authentication dependencies...')
  execSync('npm install bcryptjs@^2.4.3 jose@^5.2.2 next-auth@^4.24.5', { stdio: 'inherit' })
  
  console.log('📦 Installing type definitions...')
  execSync('npm install --save-dev @types/bcryptjs@^2.4.6', { stdio: 'inherit' })
  
  console.log('✅ Dependencies installed successfully!\n')
  
  // Check if .env.local exists
  const envPath = '.env.local'
  let envExists = fs.existsSync(envPath)
  
  if (!envExists) {
    console.log('📝 Creating .env.local from .env.example...')
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', envPath)
      envExists = true
      console.log('✅ .env.local created from .env.example')
    }
  }
  
  if (envExists) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    
    // Check if JWT_SECRET is set
    if (!envContent.includes('JWT_SECRET=') || envContent.includes('JWT_SECRET=your-super-secure-jwt-secret-key')) {
      console.log('⚠️  Warning: JWT_SECRET needs to be set in .env.local')
      console.log('   Generate a secure secret with: openssl rand -base64 32')
      console.log('   Or use online generator: https://generate-secret.vercel.app/32\n')
    }
  }
  
  console.log('🚀 Next Steps:\n')
  console.log('1. 🔑 Set a secure JWT_SECRET in .env.local')
  console.log('   Generate with: openssl rand -base64 32\n')
  
  console.log('2. 🗄️  Set up authentication database tables:')
  console.log('   - Go to your Supabase dashboard > SQL Editor')
  console.log('   - Copy and paste src/lib/database-schema-auth.sql')
  console.log('   - Run the SQL to create authentication tables\n')
  
  console.log('3. 🔐 Initialize the authentication system:')
  console.log('   node scripts/setup-auth.js\n')
  
  console.log('4. 🏃 Start the development server:')
  console.log('   npm run dev\n')
  
  console.log('5. 🧪 Test authentication:')
  console.log('   - Visit http://localhost:3000/login')
  console.log('   - Use admin@talentguard.com / TalentGuard2024!')
  console.log('   - Change password after first login!\n')
  
  console.log('📚 Documentation:')
  console.log('   - Security Guide: ./SECURITY.md')
  console.log('   - API Documentation: Check individual API route files')
  console.log('   - Authentication: src/lib/auth.ts\n')
  
  console.log('✅ Security setup is ready!')

} catch (error) {
  console.error('❌ Error installing dependencies:', error.message)
  process.exit(1)
}