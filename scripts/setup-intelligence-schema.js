#!/usr/bin/env node

/**
 * Setup Intelligence Database Schema
 * Creates the required tables for connection intelligence research
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

async function setupIntelligenceSchema() {
  console.log('🔧 Setting up Connection Intelligence Database Schema...')

  // Get Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    console.log('Please check your .env.local file')
    process.exit(1)
  }

  if (!supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    console.log('You need to add your Supabase service role key to .env.local')
    console.log('Find it in Supabase Dashboard > Settings > API > service_role key')
    process.exit(1)
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Read the intelligence schema SQL
    const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'database-schema-intelligence.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')

    console.log('📜 Executing intelligence database schema...')
    
    // Execute the schema SQL
    // Note: Supabase client doesn't have direct SQL execution, so we'll need to do this manually
    // For now, we'll provide instructions to the user
    
    console.log(`
🎯 NEXT STEPS:

1. Open your Supabase Dashboard: ${supabaseUrl.replace('https://', 'https://app.')}/project/dashboard
   
2. Go to SQL Editor in the left sidebar

3. Create a new query and paste the following SQL:

---COPY THIS SQL---
${schemaSql}
---END SQL---

4. Run the SQL to create the intelligence tables

5. Verify the tables were created in Database > Tables

💡 Once the tables are created, your intelligence research will be automatically saved to the database!

`)

    console.log('✅ Intelligence schema setup instructions provided')
    console.log('📊 After running the SQL, your dashboard will show persistent research results')

  } catch (error) {
    console.error('❌ Error setting up intelligence schema:', error.message)
    process.exit(1)
  }
}

// Run the setup
setupIntelligenceSchema().catch(console.error)