import { NextRequest, NextResponse } from 'next/server';
import { airtable, tables } from '@/lib/airtable';

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
    
    const records = await airtable
      .base(tables.research) // Using 'research' instead of 'reports' to match our existing structure
      .select({ 
        filterByFormula: filterFormula || '',
        sort: [{ field: 'Created At', direction: 'desc' }],
        maxRecords: 100
      })
      .all();
    
    return NextResponse.json(
      records.map(r => {
        const fields = { ...r.fields };
        
        // Parse JSON fields
        if (fields.Insights && typeof fields.Insights === 'string') {
          try {
            fields.Insights = JSON.parse(fields.Insights);
          } catch (e) {
            fields.Insights = [];
          }
        }
        
        if (fields.Recommendations && typeof fields.Recommendations === 'string') {
          try {
            fields.Recommendations = JSON.parse(fields.Recommendations);
          } catch (e) {
            fields.Recommendations = [];
          }
        }
        
        return { id: r.id, ...fields };
      })
    );
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query,
      context,
      summary,
      insights,
      recommendations,
      talentGuardScore,
      buyingProbability,
      companyId,
      contactId
    } = body;
    
    if (!query || !summary) {
      return NextResponse.json(
        { error: 'Query and summary are required' },
        { status: 400 }
      );
    }
    
    const record = await airtable
      .base(tables.research)
      .create({ 
        'Query': query,
        'Context': context || '',
        'Summary': summary,
        'Insights': JSON.stringify(insights || []),
        'Recommendations': JSON.stringify(recommendations || []),
        'TalentGuard Score': talentGuardScore || 0,
        'Buying Probability': buyingProbability || 0,
        'Company ID': companyId ? [companyId] : [],
        'Contact ID': contactId ? [contactId] : [],
        'Created At': new Date().toISOString(),
        'Updated At': new Date().toISOString()
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