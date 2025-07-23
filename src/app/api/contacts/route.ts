import { NextRequest, NextResponse } from 'next/server';
import { airtable, tables } from '@/lib/airtable';

// GET /api/contacts?email=example@domain.com
// GET /api/contacts?companyId=recXXXXXXXX
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const companyId = searchParams.get('companyId');
    
    let filterFormula = '';
    
    if (email) {
      filterFormula = `{Email} = '${email}'`;
    } else if (companyId) {
      filterFormula = `FIND('${companyId}', {Company ID})`;
    }
    
    const records = await airtable
      .base(tables.contacts)
      .select({ 
        filterByFormula: filterFormula || '' 
      })
      .all();
    
    return NextResponse.json(
      records.map(r => ({ id: r.id, ...r.fields }))
    );
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// POST /api/contacts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      title, 
      company, 
      companyId,
      phone,
      linkedin,
      location,
      talentGuardScore,
      buyingSignals
    } = body;
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    const record = await airtable
      .base(tables.contacts)
      .create({ 
        'Full Name': name,
        'Email': email,
        'Job Title': title || '',
        'Company Name': company || '',
        'Company ID': companyId ? [companyId] : [],
        'Phone': phone || '',
        'LinkedIn URL': linkedin || '',
        'Location': location || '',
        'TalentGuard Score': talentGuardScore || 0,
        'Buying Signals': buyingSignals || 0,
        'Created At': new Date().toISOString(),
        'Updated At': new Date().toISOString()
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