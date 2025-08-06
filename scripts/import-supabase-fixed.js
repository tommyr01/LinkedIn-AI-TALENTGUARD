#!/usr/bin/env node

// Import data from Airtable export to Supabase (Fixed with correct schema)
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Input directory
const inputDir = path.join(__dirname, 'airtable-export');

// ID mapping to maintain relationships
const idMappings = {
  companies: {},
  contacts: {},
  signals: {},
  tasks: {},
  research: {},
  opportunities: {},
  insights: {}
};

// Helper function to generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Import companies
async function importCompanies() {
  console.log('\n📤 Importing companies...');
  
  const data = JSON.parse(fs.readFileSync(path.join(inputDir, 'companies.json'), 'utf8'));
  const companies = [];
  
  for (const record of data) {
    const newId = generateUUID();
    idMappings.companies[record.id] = newId;
    
    companies.push({
      id: newId,
      name: record.fields['Name'] || null,
      domain: record.fields['Domain'] || null,
      industry: record.fields['Industry'] || null,
      tg_customer: record.fields['TG Customer?'] || false,
      current_news: record.fields['Current News'] || null,
      last_signal_date: record.fields['Last Signal Date'] || null,
      created_at: record.createdTime || new Date().toISOString()
    });
  }
  
  if (companies.length > 0) {
    const { data: inserted, error } = await supabase
      .from('company')
      .insert(companies)
      .select();
    
    if (error) {
      console.error('❌ Error importing companies:', error);
      return 0;
    }
    
    console.log(`✅ Imported ${inserted.length} companies`);
    return inserted.length;
  }
  
  return 0;
}

// Import contacts
async function importContacts() {
  console.log('\n📤 Importing contacts...');
  
  const data = JSON.parse(fs.readFileSync(path.join(inputDir, 'contacts.json'), 'utf8'));
  const contacts = [];
  
  for (const record of data) {
    const newId = generateUUID();
    idMappings.contacts[record.id] = newId;
    
    // Map company relationship (account_id in contacts table)
    const accountId = record.fields['Account']?.[0] 
      ? idMappings.companies[record.fields['Account'][0]] 
      : null;
    
    contacts.push({
      id: newId,
      name: record.fields['Name'] || null,
      title: record.fields['Title'] || null,
      email: record.fields['Email'] || null,
      linkedin_url: record.fields['LinkedIn URL'] || null,
      role_category: record.fields['Role Category'] || null,
      account_id: accountId,
      created_at: record.createdTime || new Date().toISOString()
    });
  }
  
  if (contacts.length > 0) {
    const { data: inserted, error } = await supabase
      .from('contacts')
      .insert(contacts)
      .select();
    
    if (error) {
      console.error('❌ Error importing contacts:', error);
      return 0;
    }
    
    console.log(`✅ Imported ${inserted.length} contacts`);
    return inserted.length;
  }
  
  return 0;
}

// Import signals
async function importSignals() {
  console.log('\n📤 Importing signals...');
  
  const data = JSON.parse(fs.readFileSync(path.join(inputDir, 'signals.json'), 'utf8'));
  const signals = [];
  
  for (const record of data) {
    const newId = generateUUID();
    idMappings.signals[record.id] = newId;
    
    // Map relationships
    const linkedAccountId = record.fields['Linked Account']?.[0] 
      ? idMappings.companies[record.fields['Linked Account'][0]] 
      : null;
    
    const linkedContactId = record.fields['Linked Contact']?.[0] 
      ? idMappings.contacts[record.fields['Linked Contact'][0]] 
      : null;
    
    signals.push({
      id: newId,
      source_url: record.fields['Source URL'] || null,
      date: record.fields['Date'] || null,
      type: record.fields['Type'] || null,
      summary: record.fields['Summary'] || null,
      linked_account_id: linkedAccountId,
      linked_contact_id: linkedContactId,
      signal_impact: record.fields['Signal Impact'] || null,
      signal_sentiment: record.fields['Signal Sentiment'] || null,
      created_at: record.createdTime || new Date().toISOString()
    });
  }
  
  if (signals.length > 0) {
    const { data: inserted, error } = await supabase
      .from('signals')
      .insert(signals)
      .select();
    
    if (error) {
      console.error('❌ Error importing signals:', error);
      return 0;
    }
    
    console.log(`✅ Imported ${inserted.length} signals`);
    return inserted.length;
  }
  
  return 0;
}

// Import tasks
async function importTasks() {
  console.log('\n📤 Importing tasks...');
  
  const data = JSON.parse(fs.readFileSync(path.join(inputDir, 'tasks.json'), 'utf8'));
  const tasks = [];
  
  for (const record of data) {
    const newId = generateUUID();
    idMappings.tasks[record.id] = newId;
    
    // Map relationships
    const relatedAccountId = record.fields['Related Account']?.[0] 
      ? idMappings.companies[record.fields['Related Account'][0]] 
      : null;
    
    const relatedContactId = record.fields['Related Contact']?.[0] 
      ? idMappings.contacts[record.fields['Related Contact'][0]] 
      : null;
    
    tasks.push({
      id: newId,
      task_name: record.fields['Task Name'] || null,
      task_type: record.fields['Task Type'] || null,
      status: record.fields['Status'] || null,
      due_date: record.fields['Due Date'] || null,
      owner: record.fields['Owner'] || null,
      related_account_id: relatedAccountId,
      related_contact_id: relatedContactId,
      task_priority: record.fields['Task Priority'] || null,
      suggested_next_action: record.fields['Suggested Next Action'] || null,
      created_at: record.createdTime || new Date().toISOString()
    });
  }
  
  if (tasks.length > 0) {
    const { data: inserted, error } = await supabase
      .from('tasks')
      .insert(tasks)
      .select();
    
    if (error) {
      console.error('❌ Error importing tasks:', error);
      return 0;
    }
    
    console.log(`✅ Imported ${inserted.length} tasks`);
    return inserted.length;
  }
  
  return 0;
}

// Import research (uses auto-increment ID, so we'll handle mapping differently)
async function importResearch() {
  console.log('\n📤 Importing research...');
  
  const data = JSON.parse(fs.readFileSync(path.join(inputDir, 'research.json'), 'utf8'));
  const research = [];
  
  for (const record of data) {
    // Map relationships
    const accountId = record.fields['Account']?.[0] 
      ? idMappings.companies[record.fields['Account'][0]] 
      : null;
    
    const contactId = record.fields['Contact']?.[0] 
      ? idMappings.contacts[record.fields['Contact'][0]] 
      : null;
    
    research.push({
      account_id: accountId,
      contact_id: contactId,
      topic: record.fields['Topic'] || null,
      summary: record.fields['Summary'] || null,
      source_url: record.fields['Source URL'] || null,
      insight_bullets: record.fields['Insight Bullets'] || null,
      research_created_date: record.createdTime ? new Date(record.createdTime).toISOString().split('T')[0] : null,
      title: record.fields['Title'] || null,
      executive_summary: record.fields['Executive Summary'] || null,
      top_opportunities: record.fields['Top Opportunities'] || null,
      key_insights: record.fields['Key Insights'] || null,
      created_at: record.createdTime || new Date().toISOString()
    });
  }
  
  if (research.length > 0) {
    const { data: inserted, error } = await supabase
      .from('research')
      .insert(research)
      .select();
    
    if (error) {
      console.error('❌ Error importing research:', error);
      return 0;
    }
    
    // Store mapping for auto-increment IDs
    inserted.forEach((insertedRecord, index) => {
      idMappings.research[data[index].id] = insertedRecord.id;
    });
    
    console.log(`✅ Imported ${inserted.length} research records`);
    return inserted.length;
  }
  
  return 0;
}

// Import opportunities
async function importOpportunities() {
  console.log('\n📤 Importing opportunities...');
  
  const data = JSON.parse(fs.readFileSync(path.join(inputDir, 'opportunities.json'), 'utf8'));
  const opportunities = [];
  
  for (const record of data) {
    const newId = generateUUID();
    idMappings.opportunities[record.id] = newId;
    
    // Map relationships
    const researchReportId = record.fields['Research Report']?.[0] 
      ? idMappings.research[record.fields['Research Report'][0]] 
      : null;
    
    const associatedCompanyId = record.fields['Associated Company']?.[0] 
      ? idMappings.companies[record.fields['Associated Company'][0]] 
      : null;
    
    opportunities.push({
      id: newId,
      title: record.fields['Title'] || null,
      need_statement: record.fields['Need Statement'] || null,
      validation: record.fields['Validation'] || null,
      product_mapping: record.fields['Product Mapping'] || null,
      chro_value: record.fields['CHRO Value'] || null,
      deal_accelerators: record.fields['Deal Accelerators'] || null,
      research_report_id: researchReportId,
      associated_company_id: associatedCompanyId,
      created_at: record.createdTime || new Date().toISOString()
    });
  }
  
  if (opportunities.length > 0) {
    const { data: inserted, error } = await supabase
      .from('opportunities')
      .insert(opportunities)
      .select();
    
    if (error) {
      console.error('❌ Error importing opportunities:', error);
      return 0;
    }
    
    console.log(`✅ Imported ${inserted.length} opportunities`);
    return inserted.length;
  }
  
  return 0;
}

// Import insights (uses auto-increment ID)
async function importInsights() {
  console.log('\n📤 Importing insights...');
  
  const data = JSON.parse(fs.readFileSync(path.join(inputDir, 'insights.json'), 'utf8'));
  const insights = [];
  
  for (const record of data) {
    // Map relationships
    const researchReportId = record.fields['Research Report']?.[0] 
      ? idMappings.research[record.fields['Research Report'][0]] 
      : null;
    
    const relatedOpportunityId = record.fields['Related Opportunity']?.[0] 
      ? idMappings.opportunities[record.fields['Related Opportunity'][0]] 
      : null;
    
    const companyId = record.fields['Company']?.[0] 
      ? idMappings.companies[record.fields['Company'][0]] 
      : null;
    
    insights.push({
      type: record.fields['Type'] || null,
      description: record.fields['Description'] || null,
      priority: record.fields['Priority'] || null,
      direct_quotes: record.fields['Direct Quotes'] || null,
      source: record.fields['Source'] || null,
      date: record.fields['Date'] || null,
      research_report_id: researchReportId,
      related_opportunity_id: relatedOpportunityId,
      company_id: companyId,
      summary: record.fields['Summary (AI)'] || null,
      tags: record.fields['Tags (AI)'] || null,
      created_at: record.createdTime || new Date().toISOString()
    });
  }
  
  if (insights.length > 0) {
    const { data: inserted, error } = await supabase
      .from('insights')
      .insert(insights)
      .select();
    
    if (error) {
      console.error('❌ Error importing insights:', error);
      return 0;
    }
    
    console.log(`✅ Imported ${inserted.length} insights`);
    return inserted.length;
  }
  
  return 0;
}

// Main import function
async function importAllData() {
  console.log('🚀 Starting Supabase import with corrected schema...');
  console.log(`📁 Input directory: ${inputDir}`);
  
  // Check if export directory exists
  if (!fs.existsSync(inputDir)) {
    console.error(`❌ Export directory not found: ${inputDir}`);
    console.error('Please run export-airtable.js first');
    process.exit(1);
  }
  
  // Import in order to maintain relationships
  const results = {
    companies: await importCompanies(),
    contacts: await importContacts(),
    signals: await importSignals(),
    tasks: await importTasks(),
    research: await importResearch(),
    opportunities: await importOpportunities(),
    insights: await importInsights()
  };
  
  // Save ID mappings for reference
  fs.writeFileSync(
    path.join(__dirname, 'id-mappings.json'),
    JSON.stringify(idMappings, null, 2)
  );
  
  console.log('\n📊 Import Summary:');
  console.log('==================');
  const totalRecords = Object.values(results).reduce((sum, count) => sum + count, 0);
  Object.entries(results).forEach(([table, count]) => {
    console.log(`${table}: ${count} records`);
  });
  console.log(`\nTotal: ${totalRecords} records imported`);
  
  console.log('\n✨ Import complete!');
  console.log('ID mappings saved to: id-mappings.json');
}

// Run import
importAllData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});