import { NextRequest, NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';
import { supabase } from '@/lib/supabase';

// Feature flag - set to true to use Supabase
const USE_SUPABASE = process.env.USE_SUPABASE === 'true' || false;

// GET /api/reports?companyId=recXXXXXXXX
// GET /api/reports?contactId=recXXXXXXXX
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const contactId = searchParams.get('contactId');
    
    if (USE_SUPABASE) {
      // Supabase implementation
      console.log('Fetching reports/research from Supabase...');
      
      let query = supabase
        .from('research')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (companyId) {
        query = query.eq('account_id', companyId);
      } else if (contactId) {
        query = query.eq('contact_id', contactId);
      }
      
      const { data: research, error } = await query;
      
      if (error) throw error;
      
      console.log('Fetched reports from Supabase:', research?.length || 0);
      return NextResponse.json(research || []);
      
    } else {
      // Original Airtable implementation
      let filterFormula = '';
      
      if (companyId) {
        filterFormula = `FIND('${companyId}', {Company ID})`;
      } else if (contactId) {
        filterFormula = `FIND('${contactId}', {Contact ID})`;
      }
      
      const records = await airtableBase(tables.research)
        .select({
          filterByFormula: filterFormula || '',
          sort: [{ field: 'Created At', direction: 'desc' }]
        })
        .all();
      
      return NextResponse.json(
        records.map(r => ({ id: r.id, ...r.fields }))
      );
    }
  } catch (error) {
    console.error(`Error fetching reports (${USE_SUPABASE ? 'Supabase' : 'Airtable'}):`, error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reports',
        source: USE_SUPABASE ? 'Supabase' : 'Airtable'
      },
      { status: 500 }
    );
  }
}

// POST /api/reports (for quick-add)
export async function POST(request: NextRequest) {
  try {
    const { title, content, summary, type, companyId, contactId, account_id, contact_id } = await request.json();
    
    if (!title || (!content && !summary)) {
      return NextResponse.json(
        { error: 'Title and content/summary are required' },
        { status: 400 }
      );
    }
    
    if (USE_SUPABASE) {
      // Supabase implementation
      console.log('Creating report/research in Supabase...');
      
      const { data: research, error } = await supabase
        .from('research')
        .insert({
          title,
          summary: summary || content,
          topic: type || 'Other',
          account_id: account_id || companyId || null,
          contact_id: contact_id || contactId || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return NextResponse.json(research, { status: 201 });
      
    } else {
      // Original Airtable implementation
      const record = await airtableBase(tables.research)
        .create({ 
          'Title': title,
          'Content': content || summary,
          'Type': type || 'General',
          'Company ID': companyId ? [companyId] : [],
          'Contact ID': contactId ? [contactId] : [],
          'Created At': new Date().toISOString()
        });
      
      return NextResponse.json(
        { id: record.id, ...record.fields },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error(`Error creating report (${USE_SUPABASE ? 'Supabase' : 'Airtable'}):`, error);
    return NextResponse.json(
      { 
        error: 'Failed to create report',
        source: USE_SUPABASE ? 'Supabase' : 'Airtable'
      },
      { status: 500 }
    );
  }
}