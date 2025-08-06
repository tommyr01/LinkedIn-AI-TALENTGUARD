import { NextRequest, NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';
import { supabase, contactOperations, isSupabaseConfigured, validateSupabaseConfig } from '@/lib/supabase';

// Feature flag - set to true to use Supabase
const USE_SUPABASE = process.env.USE_SUPABASE === 'true' || false;

// GET /api/contacts?email=example@domain.com
// GET /api/contacts?companyId=recXXXXXXXX
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const companyId = searchParams.get('company');
    
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
      console.log('Fetching contacts from Supabase...');
      
      let query = supabase
        .from('contacts')
        .select('*')
        .limit(100);
      
      if (email) {
        query = query.eq('email', email);
      }
      
      if (companyId) {
        query = query.eq('account_id', companyId);
      }
      
      const { data: contacts, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log('Fetched contacts from Supabase:', contacts?.length || 0);
      return NextResponse.json(contacts || []);
      
    } else {
      // Original Airtable implementation
      const selectOpts: any = { maxRecords: 100 };
      
      if (email) {
        selectOpts.filterByFormula = `{Email} = '${email}'`;
      }
      
      const records = await airtableBase(tables.contacts).select(selectOpts).all();
      
      let filteredRecords = records;
      if (companyId) {
        filteredRecords = records.filter(record => {
          const accountField = record.fields['Account'] as string[];
          return accountField && accountField.includes(companyId);
        });
      }

      return NextResponse.json(
        filteredRecords.map(r => ({ id: r.id, ...r.fields }))
      );
    }
  } catch (error) {
    console.error(`Error fetching contacts (${USE_SUPABASE ? 'Supabase' : 'Airtable'}):`, error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch contacts',
        source: USE_SUPABASE ? 'Supabase' : 'Airtable'
      },
      { status: 500 }
    );
  }
}

// POST /api/contacts (for quick-add)
export async function POST(request: NextRequest) {
  try {
    const { name, email, company, title, account_id } = await request.json();
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    if (USE_SUPABASE) {
      // Supabase implementation
      console.log('Creating contact in Supabase...');
      
      const result = await contactOperations.create({
        name,
        email,
        title: title || undefined,
        account_id: account_id || undefined,
        linkedin_url: undefined,
        role_category: undefined
      });
      
      if (!result.success) {
        throw result.error;
      }
      
      return NextResponse.json(result.data, { status: 201 });
      
    } else {
      // Original Airtable implementation
      const record = await airtableBase(tables.contacts)
        .create({ 
          'Full Name': name,
          'Email': email,
          'Company Name': company || '',
          'Job Title': title || ''
        });
      
      return NextResponse.json(
        { id: record.id, ...record.fields },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error(`Error creating contact (${USE_SUPABASE ? 'Supabase' : 'Airtable'}):`, error);
    return NextResponse.json(
      { 
        error: 'Failed to create contact',
        source: USE_SUPABASE ? 'Supabase' : 'Airtable'
      },
      { status: 500 }
    );
  }
}