#!/usr/bin/env node

// Check Supabase schema to see what columns exist
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking Supabase schema...\n');

  // Try to fetch one row from each table to see the structure
  const tables = ['company', 'contacts', 'signals', 'tasks', 'research', 'opportunities', 'insights'];
  
  for (const table of tables) {
    console.log(`\n📊 Table: ${table}`);
    console.log('================');
    
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ Error: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]).join(', '));
      console.log('Sample row:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('✅ Table exists but is empty');
      // Try to insert an empty row to see what columns are required
      const { error: insertError } = await supabase
        .from(table)
        .insert({})
        .select();
      
      if (insertError) {
        console.log('Column info from error:', insertError.message);
      }
    }
  }
}

checkSchema().catch(console.error);