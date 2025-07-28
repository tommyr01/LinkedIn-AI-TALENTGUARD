import { NextRequest, NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account');

    const selectOpts: any = { maxRecords: 50, sort: [{ field: 'Created Date', direction: 'desc' }] };
    
    const records = await airtableBase(tables.research).select(selectOpts).all();
    
    // Filter records in JavaScript since Airtable formulas for linked records are complex
    let filteredRecords = records;
    if (accountId) {
      filteredRecords = records.filter(record => {
        const accountField = record.fields['Account'] as string[];
        return accountField && accountField.includes(accountId);
      });
    }

    // Helper function to format date
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit', 
        year: 'numeric'
      });
    };

    const response = filteredRecords.map(r => ({
      id: r.id,
      title: r.fields['Created Date'] ? formatDate(r.fields['Created Date'] as string) : 'No Date',
      summary: r.fields['Summary'] || '',
      createdDate: r.fields['Created Date'] || null,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching research:', error);
    return NextResponse.json({ error: 'Failed to fetch research' }, { status: 500 });
  }
} 