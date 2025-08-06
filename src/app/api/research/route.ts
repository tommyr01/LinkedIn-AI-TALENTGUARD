import { NextRequest, NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';
import { supabase, isSupabaseConfigured, validateSupabaseConfig } from '@/lib/supabase';

// Feature flag - set to true to use Supabase
const USE_SUPABASE = process.env.USE_SUPABASE === 'true' || false;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account');

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
      console.log('Fetching research from Supabase...');
      
      let query = supabase
        .from('research')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (accountId) {
        query = query.eq('account_id', accountId);
      }
      
      const { data: research, error } = await query;
      
      if (error) throw error;
      
      console.log('Fetched research from Supabase:', research?.length || 0);
      
      // Helper function to format date
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit', 
          year: 'numeric'
        });
      };

      const response = (research || []).map(r => ({
        id: r.id,
        title: r.research_created_date ? formatDate(r.research_created_date) : (r.title || 'No Title'),
        summary: r.summary || r.executive_summary || '',
        createdDate: r.research_created_date || r.created_at,
      }));

      return NextResponse.json(response);
      
    } else {
      // Original Airtable implementation
      const selectOpts: any = { maxRecords: 50, sort: [{ field: 'Created Date', direction: 'desc' }] };
      
      const records = await airtableBase(tables.research).select(selectOpts).all();
      
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
    }
  } catch (error) {
    console.error(`Error fetching research (${USE_SUPABASE ? 'Supabase' : 'Airtable'}):`, error);
    return NextResponse.json({ 
      error: 'Failed to fetch research',
      source: USE_SUPABASE ? 'Supabase' : 'Airtable'
    }, { status: 500 });
  }
}