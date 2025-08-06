#!/usr/bin/env node

// Add test data to Supabase for testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestData() {
  console.log('Adding test data to Supabase...\n');

  // Add test companies
  const testCompanies = [
    {
      name: 'Test Company 1',
      domain: 'testcompany1.com',
      industry: 'Technology',
      tg_customer: true,
      current_news: 'Test Company 1 announces new product launch',
      last_signal_date: '2024-01-15',
      description: 'A leading technology company',
      talentguard_score: 85
    },
    {
      name: 'Test Company 2',
      domain: 'testcompany2.com',
      industry: 'Healthcare',
      tg_customer: false,
      current_news: 'Test Company 2 expands operations',
      last_signal_date: '2024-01-10',
      description: 'Healthcare innovation leader',
      talentguard_score: 72
    },
    {
      name: 'Test Company 3',
      domain: 'testcompany3.com',
      industry: 'Finance',
      tg_customer: true,
      current_news: 'Test Company 3 reports strong Q4 results',
      last_signal_date: '2024-01-20',
      description: 'Financial services provider',
      talentguard_score: 90
    }
  ];

  console.log('📥 Adding companies...');
  const { data: companies, error: companiesError } = await supabase
    .from('company')
    .insert(testCompanies)
    .select();

  if (companiesError) {
    console.error('❌ Error adding companies:', companiesError);
    return;
  }

  console.log(`✅ Added ${companies.length} test companies`);

  // Add test contacts for the first company
  if (companies && companies.length > 0) {
    const testContacts = [
      {
        name: 'John Doe',
        title: 'CEO',
        email: 'john.doe@testcompany1.com',
        company_id: companies[0].id,
        linkedin_url: 'https://linkedin.com/in/johndoe',
        role_category: 'Executive',
        talentguard_score: 95
      },
      {
        name: 'Jane Smith',
        title: 'CTO',
        email: 'jane.smith@testcompany1.com',
        company_id: companies[0].id,
        linkedin_url: 'https://linkedin.com/in/janesmith',
        role_category: 'Executive',
        talentguard_score: 88
      }
    ];

    console.log('\n📥 Adding contacts...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .insert(testContacts)
      .select();

    if (contactsError) {
      console.error('❌ Error adding contacts:', contactsError);
    } else {
      console.log(`✅ Added ${contacts.length} test contacts`);
    }

    // Add test signals
    const testSignals = [
      {
        company_id: companies[0].id,
        date: '2024-01-15',
        type: 'News',
        summary: 'Company announces major product launch',
        source_url: 'https://example.com/news/1',
        impact: 'High',
        sentiment: 'Positive'
      },
      {
        company_id: companies[1].id,
        date: '2024-01-10',
        type: 'Funding',
        summary: 'Company raises $50M in Series B',
        source_url: 'https://example.com/news/2',
        impact: 'High',
        sentiment: 'Positive'
      }
    ];

    console.log('\n📥 Adding signals...');
    const { data: signals, error: signalsError } = await supabase
      .from('signals')
      .insert(testSignals)
      .select();

    if (signalsError) {
      console.error('❌ Error adding signals:', signalsError);
    } else {
      console.log(`✅ Added ${signals.length} test signals`);
    }
  }

  console.log('\n✨ Test data added successfully!');
  console.log('You can now test the API with USE_SUPABASE=true');
}

addTestData().catch(console.error);