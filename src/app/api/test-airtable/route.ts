import { NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';

export async function GET() {
  try {
    // Get the configuration to verify it's loading correctly
    const config = {
      tables,
      hasCompaniesTable: !!tables.companies,
    };
    
    // Try to fetch companies directly from Airtable base
    const records = await airtableBase(tables.companies)
      .select({ maxRecords: 3 })
      .all();
    
    return NextResponse.json({
      success: true,
      config,
      companies: records.length,
      sampleData: records.map(r => ({ id: r.id, fields: Object.keys(r.fields) })),
      message: 'Airtable integration is working!'
    });
  } catch (error) {
    console.error('Error testing Airtable connection:', error);
    
    return NextResponse.json({
      success: false,
      config: { tables },
      error: (error as Error).message || 'Unknown error',
      message: 'Airtable integration failed!'
    }, { status: 500 });
  }
} 