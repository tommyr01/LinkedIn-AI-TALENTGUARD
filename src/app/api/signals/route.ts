import { NextRequest, NextResponse } from 'next/server';
import { airtable, tables } from '@/lib/airtable';

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
    
    const records = await airtable
      .base(tables.signals)
      .select({ 
        filterByFormula: filterFormula || '',
        sort: [{ field: 'Created At', direction: 'desc' }],
        maxRecords: 100
      })
      .all();
    
    return NextResponse.json(
      records.map(r => ({ 
        id: r.id, 
        ...r.fields,
        metadata: r.fields.Metadata ? JSON.parse(r.fields.Metadata as string) : {}
      }))
    );
  } catch (error) {
    console.error('Error fetching signals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    );
  }
}

// POST /api/signals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      type,
      title,
      description,
      company,
      companyId,
      contact,
      contactId,
      score,
      priority,
      confidence,
      metadata
    } = body;
    
    if (!type || !title || !description) {
      return NextResponse.json(
        { error: 'Type, title, and description are required' },
        { status: 400 }
      );
    }
    
    const record = await airtable
      .base(tables.signals)
      .create({ 
        'Signal Type': type,
        'Title': title,
        'Description': description,
        'Company Name': company || '',
        'Company ID': companyId ? [companyId] : [],
        'Contact Name': contact || '',
        'Contact ID': contactId ? [contactId] : [],
        'Score': score || 0,
        'Priority': priority || 'Medium',
        'Confidence': confidence || 0,
        'Metadata': metadata ? JSON.stringify(metadata) : '{}',
        'Created At': new Date().toISOString(),
        'Updated At': new Date().toISOString()
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