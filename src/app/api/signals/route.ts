import { NextRequest, NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';
import { supabase, signalOperations, isSupabaseConfigured, validateSupabaseConfig } from '@/lib/supabase';

// Feature flag - set to true to use Supabase
const USE_SUPABASE = process.env.USE_SUPABASE === 'true' || false;

// GET /api/signals?companyId=recXXXXXXXX
// GET /api/signals?contactId=recXXXXXXXX
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const contactId = searchParams.get('contactId');
    
    if (USE_SUPABASE) {
      // Validate Supabase configuration at runtime
      if (!isSupabaseConfigured()) {
        const { error } = validateSupabaseConfig();
        console.error('Supabase configuration error:', error);
        return NextResponse.json({
          error: 'Supabase not configured properly',
          details: error
        }, { status: 500 });
      }
      
      // Supabase implementation
      console.log('Fetching signals from Supabase...');
      
      let query = supabase
        .from('signals')
        .select('*')
        .order('date', { ascending: false });
      
      if (companyId) {
        query = query.eq('linked_account_id', companyId);
      } else if (contactId) {
        query = query.eq('linked_contact_id', contactId);
      }
      
      const { data: signals, error } = await query;
      
      if (error) throw error;
      
      console.log('Fetched signals from Supabase:', signals?.length || 0);
      return NextResponse.json(signals || []);
      
    } else {
      // Original Airtable implementation
      let filterFormula = '';
      
      if (companyId) {
        filterFormula = `FIND('${companyId}', {Company ID})`;
      } else if (contactId) {
        filterFormula = `FIND('${contactId}', {Contact ID})`;
      }
      
      const selectOptions: any = {
        sort: [{ field: 'Date', direction: 'desc' }]
      };
      if (filterFormula) {
        selectOptions.filterByFormula = filterFormula;
      }

      const records = await airtableBase(tables.signals)
        .select(selectOptions)
        .all();
      
      return NextResponse.json(
        records.map(r => ({ id: r.id, ...r.fields }))
      );
    }
  } catch (error) {
    console.error(`Error fetching signals (${USE_SUPABASE ? 'Supabase' : 'Airtable'}):`, error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch signals',
        source: USE_SUPABASE ? 'Supabase' : 'Airtable'
      },
      { status: 500 }
    );
  }
}

// POST /api/signals (for quick-add)
export async function POST(request: NextRequest) {
  try {
    const { type, description, summary, companyId, contactId, source_url, impact, sentiment } = await request.json();
    
    if (!type || (!description && !summary)) {
      return NextResponse.json(
        { error: 'Type and description/summary are required' },
        { status: 400 }
      );
    }
    
    if (USE_SUPABASE) {
      // Supabase implementation
      console.log('Creating signal in Supabase...');
      
      const { data: signal, error } = await supabase
        .from('signals')
        .insert({
          type,
          summary: summary || description,
          source_url: source_url || null,
          date: new Date().toISOString().split('T')[0], // Date only
          linked_account_id: companyId || null,
          linked_contact_id: contactId || null,
          signal_impact: impact || null,
          signal_sentiment: sentiment || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return NextResponse.json(signal, { status: 201 });
      
    } else {
      // Original Airtable implementation
      const record = await airtableBase(tables.signals)
        .create({ 
          'Signal Type': type,
          'Description': description || summary,
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
    console.error(`Error creating signal (${USE_SUPABASE ? 'Supabase' : 'Airtable'}):`, error);
    return NextResponse.json(
      { 
        error: 'Failed to create signal',
        source: USE_SUPABASE ? 'Supabase' : 'Airtable'
      },
      { status: 500 }
    );
  }
}