import { NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';

export async function POST(request: Request) {
  try {
    const { companyName } = await request.json();
    
    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }
    
    console.log(`Creating record for company: ${companyName}`);
    console.log('Using Airtable table ID:', tables.companies);
    console.log('Using Airtable base ID:', process.env.AIRTABLE_BASE_ID || 'appzgiUWBCdh58x00');
    
    // Create company record directly in Airtable
    const companyFields = {
      'Name': companyName,
      'Industry': 'Technology', // Default value
      'TG Customer?': false,
      'Engagement Score': 0, // Start with zero score
    };
    
    // Create the company record
    const [companyRecord] = await airtableBase(tables.companies).create([
      { fields: companyFields }
    ]);
    
    if (!companyRecord || !companyRecord.id) {
      throw new Error('Failed to create company record in Airtable');
    }
    
    console.log(`Created company record with ID: ${companyRecord.id}`);
    console.log('Created company record fields:', companyFields);
    console.log('Full response:', companyRecord);
    
    // Return success with the new company data
    return NextResponse.json({
      success: true,
      message: `Created record for ${companyName}`,
      company: {
        id: companyRecord.id,
        name: companyName,
        industry: 'Technology',
        isTgCustomer: false,
        engagementScore: 0
      },
      contactsCount: 0,
      activitiesCount: 0
    });
    
  } catch (error) {
    console.error('Error creating company record:', error);
    return NextResponse.json(
      { error: `Failed to create company record: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 