import { NextRequest, NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';

// GET /api/signals?companyId=recXXXXXXXX
// GET /api/signals?contactId=recXXXXXXXX
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const contactId = searchParams.get('contactId');
    
    let filterFormula = '';
    
    if (companyId) {
      filterFormula = `FIND('${companyId}', {Company ID})`;
    } else if (contactId) {
      filterFormula = `FIND('${contactId}', {Contact ID})`;
    }
    
    const records = await airtableBase(tables.signals)
      .select({ 
        filterByFormula: filterFormula || '',
        sort: [{ field: 'Created At', direction: 'desc' }]
      })
      .all();
    
    return NextResponse.json(
      records.map(r => ({ id: r.id, ...r.fields }))
    );
  } catch (error) {
    console.error('Error fetching signals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    );
  }
}

// POST /api/signals (for quick-add)
export async function POST(request: NextRequest) {
  try {
    const { type, description, companyId, contactId, score } = await request.json();
    
    if (!type || !description) {
      return NextResponse.json(
        { error: 'Type and description are required' },
        { status: 400 }
      );
    }
    
    const record = await airtableBase(tables.signals)
      .create({ 
        'Signal Type': type,
        'Description': description,
        'Company ID': companyId ? [companyId] : [],
        'Contact ID': contactId ? [contactId] : [],
        'Score': score || 0,
        'Created At': new Date().toISOString()
      });
    
    return NextResponse.json(
      { id: record.id, ...record.fields },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating signal:', error);
    return NextResponse.json(
      { error: 'Failed to create signal' },
      { status: 500 }
    );
  }
} 