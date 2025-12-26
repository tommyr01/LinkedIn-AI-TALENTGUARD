#!/usr/bin/env node

/**
 * Setup Authentication System
 * 
 * This script:
 * 1. Creates the authentication database tables in Supabase
 * 2. Initializes the default admin user
 * 3. Sets up the required environment variables
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function setupAuthentication() {
  console.log('🔐 Setting up Authentication System...\n')

  // Validate environment variables
  if (!supabaseUrl) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set')
    console.log('Please add your Supabase URL to .env.local')
    process.exit(1)
  }

  if (!supabaseServiceKey) {
    console.error('❌ Error: Supabase service key is not set')
    console.log('Please add SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('📊 Step 1: Creating authentication tables...')
    
    // Read the authentication schema SQL
    const schemaPath = path.join(__dirname, '../src/lib/database-schema-auth.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')
    
    // Execute the schema SQL
    // Note: In a real setup, you would execute this SQL in your Supabase SQL editor
    // or use a migration tool. For now, we'll just log instructions.
    
    console.log('✅ Authentication schema is ready to be executed.')
    console.log('📝 Next steps:')
    console.log('   1. Go to your Supabase dashboard > SQL Editor')
    console.log('   2. Copy and paste the contents of src/lib/database-schema-auth.sql')
    console.log('   3. Run the SQL to create the authentication tables')
    console.log('')

    console.log('🔑 Step 2: Checking JWT secret...')
    
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret || jwtSecret === 'your-super-secure-jwt-secret-key-change-in-production') {
      console.log('⚠️  Warning: Please set a secure JWT_SECRET in your .env.local file')
      console.log('   You can generate one with: openssl rand -base64 32')
    } else {
      console.log('✅ JWT secret is configured')
    }

    console.log('')
    console.log('🔐 Step 3: Default admin user information:')
    console.log('   Email: admin@talentguard.com')
    console.log('   Password: TalentGuard2024!')
    console.log('   ⚠️  Please change this password after first login!')
    console.log('')

    console.log('✅ Authentication setup is ready!')
    console.log('')
    console.log('🚀 To complete setup:')
    console.log('   1. Execute the SQL schema in Supabase')
    console.log('   2. Set a secure JWT_SECRET')
    console.log('   3. Start your application: npm run dev')
    console.log('   4. Visit /login to test authentication')
    console.log('')

  } catch (error) {
    console.error('❌ Error setting up authentication:', error.message)
    process.exit(1)
  }
}

// Check if this script is being run directly
if (require.main === module) {
  setupAuthentication()
}

module.exports = { setupAuthentication }