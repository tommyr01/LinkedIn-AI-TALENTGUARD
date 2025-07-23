import { NextResponse } from 'next/server';
import Airtable from 'airtable';

export async function GET() {
  try {
    // Test configuration
    const baseId = process.env.AIRTABLE_BASE_ID || 'appzgiUWBCdh58x00';
    const apiKey = process.env.AIRTABLE_API_KEY || 'patIyuzOzrS9vFURu.ef38274eb40ebcee3b9ee9934be42e52a28f3bd006f4033df49fdca5fb3577a3';
    
    console.log('Debug info:', {
      hasEnvBaseId: !!process.env.AIRTABLE_BASE_ID,
      hasEnvApiKey: !!process.env.AIRTABLE_API_KEY,
      baseId: baseId,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none'
    });

    // Test Airtable connection
    const airtable = new Airtable({ apiKey });
    const base = airtable.base(baseId);
    
    // Try to fetch one record from the companies table
    const records = await base('tblJOd8XlW2sT0BQ6')
      .select({ maxRecords: 1 })
      .all();
    
    return NextResponse.json({
      success: true,
      message: 'Airtable connection successful',
      config: {
        baseId,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
        hasEnvVars: {
          baseId: !!process.env.AIRTABLE_BASE_ID,
          apiKey: !!process.env.AIRTABLE_API_KEY
        }
      },
      recordCount: records.length,
      sampleRecord: records[0] ? { id: records[0].id, fields: Object.keys(records[0].fields) } : null
    });
  } catch (error) {
    console.error('Debug error:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
      config: {
        baseId: process.env.AIRTABLE_BASE_ID || 'appzgiUWBCdh58x00',
        hasEnvVars: {
          baseId: !!process.env.AIRTABLE_BASE_ID,
          apiKey: !!process.env.AIRTABLE_API_KEY
        }
      }
    }, { status: 500 });
  }
} 