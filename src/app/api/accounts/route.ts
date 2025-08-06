import { NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';
import { supabase, companyOperations, isSupabaseConfigured, validateSupabaseConfig } from '@/lib/supabase';

// Feature flag - set to true to use Supabase
const USE_SUPABASE = process.env.USE_SUPABASE === 'true' || false;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;
    
    if (USE_SUPABASE) {
      // Validate Supabase configuration at runtime
      if (!isSupabaseConfigured()) {
        const { error } = validateSupabaseConfig();
        console.error('Supabase configuration error:', error);
        return NextResponse.json({
          error: 'Supabase not configured properly',
          details: error,
          fallback: 'Falling back to Airtable'
        }, { status: 500 });
      }
      
      // Supabase implementation with pagination
      console.log(`Fetching accounts from Supabase (page ${page}, limit ${limit})...`);
      
      const { data: companies, error, count } = await supabase
        .from('company')
        .select('*', { count: 'exact' })
        .order('current_news', { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      console.log('Fetched records count from Supabase:', companies?.length || 0);

      const accounts = (companies || []).map(company => ({
        id: company.id,
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        isTgCustomer: company.tg_customer,
        currentNews: company.current_news,
        lastSignalDate: company.last_signal_date,
        totalContacts: 0, // Will need to be calculated with a join or separate query
        recentSignalType: '', // Will need to be fetched from signals table
        industryInsights: null, // Can be added to company table if needed
      }));

      console.log('Processed Supabase accounts:', accounts.length);
      return NextResponse.json({
        data: accounts,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNext: page * limit < (count || 0),
          hasPrev: page > 1
        }
      });
      
    } else {
      // Original Airtable implementation
      console.log('Fetching accounts from Airtable table:', tables.companies);
      
      const records = await airtableBase(tables.companies)
        .select({
          maxRecords: 100,
          sort: [{ field: 'Current News', direction: 'desc' }]
        })
        .all();

      console.log('Fetched records count from Airtable:', records.length);

      const accounts = records.map(record => ({
        id: record.id,
        name: record.fields['Name'] as string,
        domain: record.fields['Domain'] as string,
        industry: record.fields['Industry'] as string,
        isTgCustomer: record.fields['TG Customer?'] as boolean,
        currentNews: record.fields['Current News'] as string,
        lastSignalDate: record.fields['Last Signal Date'] as string,
        totalContacts: record.fields['Total Contacts'] as number,
        recentSignalType: record.fields['Recent Signal Type'] as string,
        industryInsights: record.fields['Industry Insights'] as any,
      }));

      console.log('Processed Airtable accounts:', accounts.length);
      return NextResponse.json({
        data: accounts,
        pagination: {
          page,
          limit,
          total: accounts.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });
    }
  } catch (error) {
    console.error(`Detailed error in accounts endpoint (${USE_SUPABASE ? 'Supabase' : 'Airtable'}):`, {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name,
      source: USE_SUPABASE ? 'Supabase' : 'Airtable'
    });
    
    return NextResponse.json({ 
      error: 'Failed to fetch accounts',
      details: (error as Error).message,
      source: USE_SUPABASE ? 'Supabase' : 'Airtable'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
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
      console.log('Creating account in Supabase...');
      
      const result = await companyOperations.create({
        name: data.name,
        domain: data.domain,
        industry: data.industry,
        tg_customer: data.isTgCustomer || false,
        current_news: data.currentNews || null,
      });

      if (!result.success) {
        throw result.error;
      }

      return NextResponse.json(result.data);
      
    } else {
      // Original Airtable implementation
      console.log('Creating account in Airtable...');
      
      const record = await airtableBase(tables.companies).create({
        'Name': data.name,
        'Domain': data.domain,
        'Industry': data.industry,
        'TG Customer?': data.isTgCustomer || false,
        'Current News': data.currentNews || '',
      });

      return NextResponse.json({ 
        id: record.id, 
        ...record.fields 
      });
    }
  } catch (error) {
    console.error(`Error creating account (${USE_SUPABASE ? 'Supabase' : 'Airtable'}):`, error);
    return NextResponse.json({ 
      error: 'Failed to create account',
      source: USE_SUPABASE ? 'Supabase' : 'Airtable'
    }, { status: 500 });
  }
}