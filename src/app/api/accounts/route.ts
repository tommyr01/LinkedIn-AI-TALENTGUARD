import { NextRequest, NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';

// GET /api/accounts?domain=ethosenergy.com
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');
    
    const records = await airtableBase(tables.companies)
      .select({ 
        filterByFormula: domain ? `{Domain} = '${domain}'` : '' 
      })
      .all();
    
    return NextResponse.json(
      records.map(r => ({ id: r.id, ...r.fields }))
    );
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

// POST /api/accounts (for quick-add)
export async function POST(request: NextRequest) {
  try {
    const { name, domain } = await request.json();
    
    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }
    
    const record = await airtableBase(tables.companies)
      .create({ 
        'Company Name': name, 
        'Domain': domain 
      });
    
    return NextResponse.json(
      { id: record.id, ...record.fields },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
} 