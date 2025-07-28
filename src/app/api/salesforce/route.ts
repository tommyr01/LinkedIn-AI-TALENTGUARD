import { NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';

export async function POST(request: Request) {
  try {
    const { companyName } = await request.json();
    
    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }
    
    console.log(`Creating record for company: ${companyName}`);
    
    // Generate a simple domain from the company name
    const domain = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    
    // Create company record directly in Airtable
    const companyFields = {
      'Name': companyName,
      'Domain': domain,
      'Industry': 'Technology', // Default value
      'Is TG Customer': false,
      'Engagement Score': Math.floor(Math.random() * 100), // Random score for demo
    };
    
    // Create the company record
    const [companyRecord] = await airtableBase(tables.companies).create([
      { fields: companyFields }
    ]);
    
    if (!companyRecord || !companyRecord.id) {
      throw new Error('Failed to create company record in Airtable');
    }
    
    console.log(`Created company record with ID: ${companyRecord.id}`);
    
    // Return success with the new company data
    return NextResponse.json({
      success: true,
      message: `Created record for ${companyName}`,
      company: {
        id: companyRecord.id,
        ...companyFields
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