import { NextResponse } from 'next/server';
import { companyOperations, tables } from '@/lib/airtable';

export async function GET() {
  try {
    // Get the configuration to verify it's loading correctly
    const config = {
      tables,
      hasCompaniesTable: !!tables.companies,
    };
    
    // Try to fetch companies from Airtable
    const result = await companyOperations.findAll();
    
    return NextResponse.json({
      success: true,
      config,
      companies: result.data?.length || 0,
      message: 'Airtable integration is working!'
    });
  } catch (error) {
    console.error('Error testing Airtable connection:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'Unknown error',
      message: 'Failed to connect to Airtable'
    }, { status: 500 });
  }
} 