#!/usr/bin/env node

// Add minimal test data to Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestData() {
  console.log('Adding minimal test data to Supabase...\n');

  // Add minimal test companies with only required fields
  const testCompanies = [
    {
      name: 'Test Company 1',
      domain: 'testcompany1.com',
      industry: 'Technology',
      tg_customer: true,
      current_news: 'Test Company 1 announces new product launch',
    },
    {
      name: 'Test Company 2',
      domain: 'testcompany2.com',
      industry: 'Healthcare',
      tg_customer: false,
      current_news: 'Test Company 2 expands operations',
    },
    {
      name: 'Test Company 3',
      domain: 'testcompany3.com',
      industry: 'Finance',
      tg_customer: true,
      current_news: null,
    }
  ];

  console.log('📥 Adding companies...');
  const { data: companies, error: companiesError } = await supabase
    .from('company')
    .insert(testCompanies)
    .select();

  if (companiesError) {
    console.error('❌ Error adding companies:', companiesError);
    console.error('Details:', companiesError.message);
    return;
  }

  console.log(`✅ Added ${companies?.length || 0} test companies`);
  
  if (companies && companies.length > 0) {
    console.log('\nCreated companies:');
    companies.forEach(c => {
      console.log(`  - ${c.name} (ID: ${c.id})`);
    });
    
    // Add test contacts
    const testContacts = [
      {
        name: 'John Doe',
        title: 'CEO',
        email: 'john.doe@testcompany1.com',
        company_id: companies[0].id,
      },
      {
        name: 'Jane Smith',
        title: 'CTO',
        email: 'jane.smith@testcompany1.com',
        company_id: companies[0].id,
      }
    ];

    console.log('\n📥 Adding contacts...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .insert(testContacts)
      .select();

    if (contactsError) {
      console.error('❌ Error adding contacts:', contactsError.message);
    } else {
      console.log(`✅ Added ${contacts?.length || 0} test contacts`);
    }

    // Add test signals
    const testSignals = [
      {
        company_id: companies[0].id,
        date: '2024-01-15',
        type: 'News',
        summary: 'Company announces major product launch',
      }
    ];

    console.log('\n📥 Adding signals...');
    const { data: signals, error: signalsError } = await supabase
      .from('signals')
      .insert(testSignals)
      .select();

    if (signalsError) {
      console.error('❌ Error adding signals:', signalsError.message);
    } else {
      console.log(`✅ Added ${signals?.length || 0} test signals`);
    }
  }

  console.log('\n✨ Test data process complete!');
  console.log('\nTo test with Supabase:');
  console.log('1. Edit .env.local and set USE_SUPABASE=true');
  console.log('2. Restart the dev server');
  console.log('3. Visit http://localhost:3000/dashboard/companies');
}

addTestData().catch(console.error);