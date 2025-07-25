import { NextResponse } from 'next/server';
import { airtableBase, tables } from '@/lib/airtable';

// This would be your MCP server endpoint
const MCP_SALESFORCE_ENDPOINT = process.env.MCP_SALESFORCE_ENDPOINT || 'https://your-mcp-server.com/api/salesforce';

export async function POST(request: Request) {
  try {
    const { companyName } = await request.json();
    
    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }
    
    console.log(`Searching Salesforce for company: ${companyName}`);
    
    // Call the MCP server to search Salesforce
    const mcpResponse = await fetch(MCP_SALESFORCE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: companyName,
        // Add any additional parameters needed by your MCP server
        fuzzyMatch: true,
        extractContacts: true,
        extractActivities: true
      }),
    });
    
    if (!mcpResponse.ok) {
      throw new Error(`MCP server responded with status: ${mcpResponse.status}`);
    }
    
    const salesforceData = await mcpResponse.json();
    
    // Process the Salesforce data and create/update records in Airtable
    const companyRecord = await createOrUpdateCompany(salesforceData.company);
    
    // If contacts data is available, create/update contact records
    if (salesforceData.contacts && salesforceData.contacts.length > 0) {
      await Promise.all(salesforceData.contacts.map(contact => 
        createOrUpdateContact(contact, companyRecord.id)));
    }
    
    // If activity data is available, create signal records
    if (salesforceData.activities && salesforceData.activities.length > 0) {
      await Promise.all(salesforceData.activities.map(activity => 
        createSignal(activity, companyRecord.id)));
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported data for ${salesforceData.company.name}`,
      companyId: companyRecord.id,
      contactsCount: salesforceData.contacts?.length || 0,
      activitiesCount: salesforceData.activities?.length || 0
    });
    
  } catch (error) {
    console.error('Error processing Salesforce data:', error);
    return NextResponse.json({ 
      error: 'Failed to import Salesforce data',
      details: (error as Error).message
    }, { status: 500 });
  }
}

// Helper function to create or update a company record in Airtable
async function createOrUpdateCompany(companyData: any) {
  // Check if company already exists by domain or name
  const filterByFormula = `OR({Domain} = "${companyData.domain}", {Name} = "${companyData.name}")`;
  
  const existingRecords = await airtableBase(tables.companies)
    .select({ filterByFormula })
    .all();
  
  if (existingRecords.length > 0) {
    // Update existing record
    const record = await airtableBase(tables.companies).update(existingRecords[0].id, {
      'Name': companyData.name,
      'Domain': companyData.domain,
      'Industry': companyData.industry,
      'Description': companyData.description,
      'TG Customer?': companyData.isTgCustomer || false,
      'LinkedIn URL': companyData.linkedinUrl,
      'Website': companyData.website,
      'Employee Count': companyData.employeeCount,
      'Revenue Range': companyData.revenueRange,
      'Location': companyData.location,
      'Salesforce ID': companyData.salesforceId,
      'Last Synced': new Date().toISOString()
    });
    
    return { id: record.id, ...record.fields };
  } else {
    // Create new record
    const record = await airtableBase(tables.companies).create({
      'Name': companyData.name,
      'Domain': companyData.domain,
      'Industry': companyData.industry,
      'Description': companyData.description,
      'TG Customer?': companyData.isTgCustomer || false,
      'LinkedIn URL': companyData.linkedinUrl,
      'Website': companyData.website,
      'Employee Count': companyData.employeeCount,
      'Revenue Range': companyData.revenueRange,
      'Location': companyData.location,
      'Salesforce ID': companyData.salesforceId,
      'Last Synced': new Date().toISOString(),
      'Source': 'Salesforce'
    });
    
    return { id: record.id, ...record.fields };
  }
}

// Helper function to create or update a contact record
async function createOrUpdateContact(contactData: any, companyId: string) {
  // Check if contact already exists by email
  const filterByFormula = `{Email} = "${contactData.email}"`;
  
  const existingRecords = await airtableBase(tables.contacts)
    .select({ filterByFormula })
    .all();
  
  const contactFields = {
    'Name': contactData.name,
    'Email': contactData.email,
    'Title': contactData.title,
    'Phone': contactData.phone,
    'LinkedIn URL': contactData.linkedinUrl,
    'Role Category': contactData.roleCategory || 'Other',
    'Account': [companyId],
    'Salesforce ID': contactData.salesforceId,
    'Last Synced': new Date().toISOString()
  };
  
  if (existingRecords.length > 0) {
    // Update existing record
    const record = await airtableBase(tables.contacts).update(existingRecords[0].id, contactFields);
    return { id: record.id, ...record.fields };
  } else {
    // Create new record
    const record = await airtableBase(tables.contacts).create({
      ...contactFields,
      'Source': 'Salesforce'
    });
    return { id: record.id, ...record.fields };
  }
}

// Helper function to create a signal record
async function createSignal(activityData: any, companyId: string) {
  try {
    const signalFields = {
      'Type': mapActivityTypeToSignalType(activityData.type),
      'Source URL': activityData.sourceUrl || '',
      'Summary': activityData.description || activityData.subject || 'Salesforce activity',
      'Date': activityData.date || new Date().toISOString(),
      'Signal Impact': activityData.importance || 'Medium',
      'Signal Sentiment': activityData.sentiment || 'Neutral',
      'Account': [companyId],
      'Salesforce ID': activityData.salesforceId,
      'Created At': new Date().toISOString()
    };
    
    // Create new signal record
    const record = await airtableBase(tables.signals).create(signalFields);
    return { id: record.id, ...record.fields };
  } catch (error) {
    console.error('Error creating signal from activity:', error);
    throw error;
  }
}

// Helper function to map Salesforce activity types to signal types
function mapActivityTypeToSignalType(activityType: string): string {
  const typeMap: Record<string, string> = {
    'Call': 'Call',
    'Email': 'Email',
    'Meeting': 'Meeting',
    'Task': 'Task',
    'Event': 'Event',
    'Note': 'Note'
  };
  
  return typeMap[activityType] || 'Other';
} 