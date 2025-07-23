import { NextRequest, NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';

// GET /api/reports?companyId=recXXXXXXXX
// GET /api/reports?contactId=recXXXXXXXX
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
    
    const records = await airtableBase(tables.research) // Using 'research' instead of 'reports' to match our existing structure
      .select({
        filterByFormula: filterFormula || '',
        sort: [{ field: 'Created At', direction: 'desc' }]
      })
      .all();
    
    return NextResponse.json(
      records.map(r => ({ id: r.id, ...r.fields }))
    );
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports (for quick-add)
export async function POST(request: NextRequest) {
  try {
    const { title, content, type, companyId, contactId } = await request.json();
    
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    const record = await airtableBase(tables.research)
      .create({ 
        'Title': title,
        'Content': content,
        'Type': type || 'General',
        'Company ID': companyId ? [companyId] : [],
        'Contact ID': contactId ? [contactId] : [],
        'Created At': new Date().toISOString()
      });
    
    return NextResponse.json(
      { id: record.id, ...record.fields },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
} 