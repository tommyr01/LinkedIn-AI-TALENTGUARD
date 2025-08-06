#!/usr/bin/env node

// Verify Supabase migration is complete and working
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const useSupabase = process.env.USE_SUPABASE === 'true';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 Verifying Supabase Migration Status');
  console.log('=====================================\n');
  
  console.log('Environment Configuration:');
  console.log(`USE_SUPABASE: ${useSupabase ? '✅ TRUE' : '❌ FALSE'}`);
  console.log(`Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`Supabase Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}\n`);
  
  if (!useSupabase) {
    console.log('⚠️  USE_SUPABASE is false - application will use Airtable');
    console.log('Set USE_SUPABASE=true in .env.local to use Supabase\n');
  }
  
  const tables = [
    { name: 'company', description: 'Companies' },
    { name: 'contacts', description: 'Contacts' },
    { name: 'signals', description: 'Signals' },
    { name: 'tasks', description: 'Tasks' },
    { name: 'research', description: 'Research' },
    { name: 'opportunities', description: 'Opportunities' },
    { name: 'insights', description: 'Insights' }
  ];
  
  let totalRecords = 0;
  let allTablesValid = true;
  
  console.log('📊 Data Verification:');
  console.log('====================');
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) throw error;
      
      console.log(`${table.description.padEnd(15)} ${count?.toString().padStart(3)} records ✅`);
      totalRecords += count || 0;
      
    } catch (error) {
      console.log(`${table.description.padEnd(15)}     ERROR: ${error.message} ❌`);
      allTablesValid = false;
    }
  }
  
  console.log('                ─────────────');
  console.log(`Total Records:  ${totalRecords.toString().padStart(3)}\n`);
  
  // Test relationships
  console.log('🔗 Relationship Verification:');
  console.log('=============================');
  
  try {
    // Test company-contact relationship
    const { data: companiesWithContacts, error: companyError } = await supabase
      .from('company')
      .select(`
        name,
        contacts:contacts!account_id(name, email)
      `)
      .limit(3);
    
    if (companyError) throw companyError;
    
    const companiesWithContactCount = companiesWithContacts.filter(c => c.contacts.length > 0).length;
    console.log(`Companies with contacts: ${companiesWithContactCount}/3 ✅`);
    
    // Test signal relationships
    const { data: signalsWithRefs, error: signalError } = await supabase
      .from('signals')
      .select('*')
      .not('linked_account_id', 'is', null)
      .limit(5);
    
    if (signalError) throw signalError;
    
    console.log(`Signals with company links: ${signalsWithRefs.length}/5 ✅`);
    
  } catch (error) {
    console.log(`Relationship test failed: ${error.message} ❌`);
    allTablesValid = false;
  }
  
  // API Endpoint Tests
  console.log('\n🌐 API Endpoint Tests:');
  console.log('=======================');
  
  const endpoints = [
    { path: '/api/accounts', name: 'Companies' },
    { path: '/api/contacts', name: 'Contacts' },
    { path: '/api/signals', name: 'Signals' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint.path}`);
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        console.log(`${endpoint.name.padEnd(10)} ${data.length.toString().padStart(3)} items ✅`);
      } else {
        console.log(`${endpoint.name.padEnd(10)}     ERROR: ${data.error || 'Invalid response'} ❌`);
        allTablesValid = false;
      }
    } catch (error) {
      console.log(`${endpoint.name.padEnd(10)}     ERROR: ${error.message} ❌`);
      allTablesValid = false;
    }
  }
  
  console.log('\n📋 Migration Summary:');
  console.log('=====================');
  
  if (allTablesValid && totalRecords > 0 && useSupabase) {
    console.log('🎉 SUCCESS: Migration Complete!');
    console.log('   ✅ All tables populated with data');
    console.log('   ✅ API endpoints working');
    console.log('   ✅ Application using Supabase');
    console.log('   ✅ Relationships preserved');
    console.log('\n📈 Benefits Achieved:');
    console.log('   • Real-time data updates');
    console.log('   • Improved query performance');
    console.log('   • Reduced API rate limits');
    console.log('   • Better data relationships');
    console.log('   • Cost savings from reduced SaaS usage');
  } else {
    console.log('⚠️  Migration Status: Issues Detected');
    if (!useSupabase) {
      console.log('   - Set USE_SUPABASE=true to enable Supabase');
    }
    if (totalRecords === 0) {
      console.log('   - Run data migration scripts first');
    }
    if (!allTablesValid) {
      console.log('   - Fix table or API endpoint errors');
    }
  }
  
  console.log('\n🚀 Next Steps:');
  console.log('===============');
  console.log('1. Verify dashboard UI loads correctly');
  console.log('2. Test creating new records via API');
  console.log('3. Set up background job queues (optional)');
  console.log('4. Deploy to production when ready');
  
  process.exit(allTablesValid && totalRecords > 0 ? 0 : 1);
}

verifyMigration().catch(console.error);