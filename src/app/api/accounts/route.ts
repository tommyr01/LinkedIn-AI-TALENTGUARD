import { NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';

export async function GET() {
  try {
    console.log('Fetching accounts from table:', tables.companies);
    
    const records = await airtableBase(tables.companies)
      .select({
        maxRecords: 100,
        sort: [{ field: 'Current News', direction: 'desc' }]
      })
      .all();

    console.log('Fetched records count:', records.length);

    const accounts = records.map(record => ({
      id: record.id,
      name: record.fields['Name'] as string,
      domain: record.fields['Domain'] as string,
      industry: record.fields['Industry'] as string,
      isTgCustomer: record.fields['TG Customer?'] as boolean,
      currentNews: record.fields['Current News'] as string,
      lastSignalDate: record.fields['Last Signal Date'] as string,
      totalContacts: record.fields['Total Contacts'] as number,
      recentSignalType: record.fields['Recent Signal Type'] as string,
      industryInsights: record.fields['Industry Insights'] as any,
    }));

    console.log('Processed accounts:', accounts.length);

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Detailed error in accounts endpoint:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name,
      tableId: tables.companies
    });
    
    return NextResponse.json({ 
      error: 'Failed to fetch accounts',
      details: (error as Error).message,
      tableId: tables.companies
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const record = await airtableBase(tables.companies).create({
      'Name': data.name,
      'Domain': data.domain,
      'Industry': data.industry,
      'TG Customer?': data.isTgCustomer || false,
      'Current News': data.currentNews || '',
    });

    return NextResponse.json({ 
      id: record.id, 
      ...record.fields 
    });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
} 