import { NextRequest, NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';

// GET /api/contacts?email=example@domain.com
// GET /api/contacts?companyId=recXXXXXXXX
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const companyId = searchParams.get('company');
    
    const selectOpts: any = { maxRecords: 100 };
    
    // Handle email filtering with Airtable formula (simple field)
    if (email) {
      selectOpts.filterByFormula = `{Email} = '${email}'`;
    }
    
    const records = await airtableBase(tables.contacts).select(selectOpts).all();
    
    // Filter by company in JavaScript since linked record formulas are complex
    let filteredRecords = records;
    if (companyId) {
      filteredRecords = records.filter(record => {
        const accountField = record.fields['Account'] as string[];
        return accountField && accountField.includes(companyId);
      });
    }

    return NextResponse.json(
      filteredRecords.map(r => ({ id: r.id, ...r.fields }))
    );
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// POST /api/contacts (for quick-add)
export async function POST(request: NextRequest) {
  try {
    const { name, email, company, title } = await request.json();
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    const record = await airtableBase(tables.contacts)
      .create({ 
        'Full Name': name,
        'Email': email,
        'Company Name': company || '',
        'Job Title': title || ''
      });
    
    return NextResponse.json(
      { id: record.id, ...record.fields },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
} 