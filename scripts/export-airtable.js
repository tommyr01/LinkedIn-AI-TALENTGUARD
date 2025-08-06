#!/usr/bin/env node

// Export all data from Airtable to JSON files
const Airtable = require('airtable');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configure Airtable
const baseId = process.env.AIRTABLE_BASE_ID || 'appzgiUWBCdh58x00';
const apiKey = process.env.AIRTABLE_API_KEY || 'patIyuzOzrS9vFURu.ef38274eb40ebcee3b9ee9934be42e52a28f3bd006f4033df49fdca5fb3577a3';

const base = new Airtable({ apiKey }).base(baseId);

// Table configurations
const tables = {
  companies: {
    id: 'tblJOd8XlW2sT0BQ6',
    name: 'Company',
    fields: ['Name', 'Domain', 'Industry', 'TG Customer?', 'Current News', 'Last Signal Date', 
             'Contacts', 'Signals', 'Tasks', 'Research', 'Opportunities', 'Company Insights',
             'Description (from Company Insights)', 'Direct Quotes (from Company Insights)']
  },
  contacts: {
    id: 'tbl78hVAHK199cm3o',
    name: 'Contacts',
    fields: ['Name', 'Title', 'Email', 'LinkedIn URL', 'Role Category', 'Account', 
             'Signals', 'Tasks', 'Research']
  },
  signals: {
    id: 'tblwrCTx3MULl71uS',
    name: 'Signals',
    fields: ['Source URL', 'Date', 'Type', 'Summary', 'Linked Contact', 'Linked Account',
             'Signal Impact', 'Signal Sentiment']
  },
  tasks: {
    id: 'tbl7QneKQyiqAcN8B',
    name: 'Tasks',
    fields: ['Task Name', 'Task Type', 'Status', 'Due Date', 'Owner', 'Related Account',
             'Related Contact', 'Task Priority', 'Suggested Next Action']
  },
  research: {
    id: 'tblM7imDwQjjh7F54',
    name: 'Research',
    fields: ['Research ID', 'Account', 'Contact', 'Topic', 'Summary', 'Source URL',
             'Insight Bullets', 'Opportunities', 'Insights', 'Title', 'Executive Summary',
             'PDF / Deck', 'Top Opportunities', 'Key Insights']
  },
  opportunities: {
    id: 'tblcSEoXFmTIYHPAW',
    name: 'Opportunities',
    fields: ['Title', 'Need Statement', 'Validation', 'Product Mapping', 'CHRO Value',
             'Deal Accelerators', 'Research Report', 'Associated Company', 'Insights']
  },
  insights: {
    id: 'tbldQUfTEWbAbLQPI',
    name: 'Insights',
    fields: ['Insight ID', 'Type', 'Description', 'Priority', 'Direct Quotes', 'Source',
             'Date', 'Research Report', 'Related Opportunity', 'Company', 'Summary (AI)', 'Tags (AI)']
  }
};

// Create output directory
const outputDir = path.join(__dirname, 'airtable-export');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Export function for each table
async function exportTable(tableKey, tableConfig) {
  console.log(`\n📥 Exporting ${tableConfig.name}...`);
  
  try {
    const records = [];
    
    await base(tableConfig.id).select({
      maxRecords: 10000,
      view: "Grid view"
    }).eachPage(function page(pageRecords, fetchNextPage) {
      pageRecords.forEach(record => {
        records.push({
          id: record.id,
          fields: record.fields,
          createdTime: record._rawJson.createdTime
        });
      });
      fetchNextPage();
    });
    
    // Save to JSON file
    const filename = path.join(outputDir, `${tableKey}.json`);
    fs.writeFileSync(filename, JSON.stringify(records, null, 2));
    
    console.log(`✅ Exported ${records.length} records from ${tableConfig.name}`);
    console.log(`   Saved to: ${filename}`);
    
    return records;
  } catch (error) {
    console.error(`❌ Error exporting ${tableConfig.name}:`, error.message);
    return [];
  }
}

// Main export function
async function exportAllTables() {
  console.log('🚀 Starting Airtable export...');
  console.log(`📁 Output directory: ${outputDir}`);
  
  const exportResults = {};
  
  for (const [key, config] of Object.entries(tables)) {
    exportResults[key] = await exportTable(key, config);
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Create summary file
  const summary = {
    exportDate: new Date().toISOString(),
    baseId: baseId,
    tables: Object.entries(exportResults).map(([key, records]) => ({
      name: key,
      recordCount: records.length
    }))
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'export-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('\n📊 Export Summary:');
  console.log('==================');
  summary.tables.forEach(table => {
    console.log(`${table.name}: ${table.recordCount} records`);
  });
  
  console.log('\n✨ Export complete!');
  console.log(`All data saved to: ${outputDir}`);
}

// Run export
exportAllTables().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});