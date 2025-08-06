#!/usr/bin/env node

// Test the Supabase API directly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseAPI() {
  console.log('Testing Supabase API...\n');

  // Test fetching companies
  console.log('📥 Fetching companies from Supabase...');
  const { data: companies, error } = await supabase
    .from('company')
    .select('*')
    .limit(10);

  if (error) {
    console.error('❌ Error fetching companies:', error);
  } else {
    console.log(`✅ Found ${companies?.length || 0} companies`);
    if (companies && companies.length > 0) {
      console.log('\nCompanies:');
      companies.forEach(c => {
        console.log(`  - ${c.name} (${c.domain}) - ${c.industry}`);
      });
    }
  }
}

testSupabaseAPI().catch(console.error);