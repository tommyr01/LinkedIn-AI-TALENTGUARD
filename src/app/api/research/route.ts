import { NextRequest, NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account');

    const selectOpts: any = { maxRecords: 50, sort: [{ field: 'Created Date', direction: 'desc' }] };
    if (accountId) {
      // filter link field "Account" contains this record ID
      selectOpts.filterByFormula = `FIND('${accountId}', ARRAYJOIN({Account}))`;
    }

    const records = await airtableBase(tables.research).select(selectOpts).all();

    const response = records.map(r => ({
      id: r.id,
      title: r.fields['Topic'] || r.fields['Research ID'] || 'Untitled Research',
      summary: r.fields['Summary'] || '',
      createdDate: r.fields['Created Date'] || null,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching research:', error);
    return NextResponse.json({ error: 'Failed to fetch research' }, { status: 500 });
  }
} 