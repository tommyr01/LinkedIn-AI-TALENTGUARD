// Airtable integration for TalentGuard Buyer Intelligence
// This module handles all Airtable operations for storing and retrieving data

import Airtable from 'airtable';

// Configure Airtable connection
const baseId = process.env.AIRTABLE_BASE_ID || 'appzgiUWBCdh58x00';
const apiKey = process.env.AIRTABLE_API_KEY || 'patIyuzOzrS9vFURu.ef38274eb40ebcee3b9ee9934be42e52a28f3bd006f4033df49fdca5fb3577a3';

// Create a configured Airtable instance
const airtableInstance = new Airtable({ apiKey });
const base = airtableInstance.base(baseId);

// Export the airtable instance and base for use in API routes
export const airtable = airtableInstance;
export const airtableBase = base;

// Table IDs - Hardcoded to ensure production works correctly
export const tables = {
  companies: 'tblJOd8XlW2sT0BQ6',
  contacts: 'tbl78hVAHK199cm3o',
  signals: 'tblwrCTx3MULl71uS',
  research: process.env.AIRTABLE_RESEARCH_TABLE || '',
  activities: process.env.AIRTABLE_ACTIVITIES_TABLE || '',
  tasks: 'tbl7QneKQyiqAcN8B',
};

// Table names for backward compatibility
export const TABLES = {
  COMPANIES: 'Companies',
  CONTACTS: 'Contacts',
  SIGNALS: 'Signals',
  RESEARCH: 'Research',
  ACTIVITIES: 'Activities'
} as const;

// Get base instance (for backward compatibility)
export const getBase = () => {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    console.warn('Using fallback Airtable credentials');
  }
  
  return base;
};

// Companies operations
export const companyOperations = {
  // Create a new company record
  async create(data: {
    name: string
    domain: string
    industry: string
    size: string
    location: string
    description?: string
    linkedin?: string
    website?: string
    employees?: number
    founded?: number
    revenue?: string
    talentGuardScore?: number
  }) {
    try {
      const record = await base(tables.companies).create({
        'Company Name': data.name,
        'Domain': data.domain,
        'Industry': data.industry,
        'Company Size': data.size,
        'Location': data.location,
        'Description': data.description || '',
        'LinkedIn URL': data.linkedin || '',
        'Website': data.website || '',
        'Employee Count': data.employees || 0,
        'Founded Year': data.founded || 0,
        'Revenue Range': data.revenue || '',
        'TalentGuard Score': data.talentGuardScore || 0,
        'Created At': new Date().toISOString(),
        'Updated At': new Date().toISOString()
      });
      
      return { success: true, data: record };
    } catch (error) {
      console.error('Error creating company:', error);
      return { success: false, error: error };
    }
  },

  // Get all companies
  async findAll() {
    try {
      const records = await base(tables.companies).select({
        maxRecords: 100,
        sort: [{ field: 'Engagement Score', direction: 'desc' }]
      }).all();
      
      return { 
        success: true, 
        data: records.map(record => ({
        id: record.id,
        ...record.fields
        }))
      };
    } catch (error) {
      console.error('Error fetching companies:', error);
      return { success: false, error: error };
    }
  },

  // Find company by domain
  async findByDomain(domain: string) {
    try {
      const records = await base(tables.companies).select({
        filterByFormula: `{Domain} = "${domain}"`,
        maxRecords: 1
      }).all();
      
      return { 
        success: true, 
        data: records.length > 0 ? { id: records[0].id, ...records[0].fields } : null 
      };
    } catch (error) {
      console.error('Error finding company by domain:', error);
      return { success: false, error: error };
    }
  },

  // Update company record
  async update(recordId: string, data: Partial<any>) {
    try {
      const record = await base(tables.companies).update(recordId, {
        ...data,
        'Updated At': new Date().toISOString()
      });
      
      return { success: true, data: record };
    } catch (error) {
      console.error('Error updating company:', error);
      return { success: false, error: error };
    }
  }
};

// Contacts operations
export const contactOperations = {
  // Create a new contact record
  async create(data: {
    name: string
    email: string
    title: string
    company: string
    companyId?: string
    phone?: string
    linkedin?: string
    location?: string
    talentGuardScore?: number
    buyingSignals?: number
  }) {
    try {
      const record = await base(tables.contacts).create({
        'Full Name': data.name,
        'Email': data.email,
        'Job Title': data.title,
        'Company Name': data.company,
        'Company ID': data.companyId ? [data.companyId] : [],
        'Phone': data.phone || '',
        'LinkedIn URL': data.linkedin || '',
        'Location': data.location || '',
        'TalentGuard Score': data.talentGuardScore || 0,
        'Buying Signals': data.buyingSignals || 0,
        'Created At': new Date().toISOString(),
        'Updated At': new Date().toISOString()
      });
      
      return { success: true, data: record };
    } catch (error) {
      console.error('Error creating contact:', error);
      return { success: false, error: error };
    }
  },

  // Get all contacts
  async findAll() {
    try {
      const records = await base(tables.contacts).select({
        maxRecords: 100,
        sort: [{ field: 'TalentGuard Score', direction: 'desc' }]
      }).all();
      
      return { 
        success: true, 
        data: records.map(record => ({
        id: record.id,
        ...record.fields
        }))
      };
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return { success: false, error: error };
    }
  },

  // Find contact by email
  async findByEmail(email: string) {
    try {
      const records = await base(tables.contacts).select({
        filterByFormula: `{Email} = "${email}"`,
        maxRecords: 1
      }).all();
      
      return { 
        success: true, 
        data: records.length > 0 ? { id: records[0].id, ...records[0].fields } : null 
      };
    } catch (error) {
      console.error('Error finding contact by email:', error);
      return { success: false, error: error };
    }
  }
};

// Signals operations
export const signalOperations = {
  // Create a new signal record
  async create(data: {
    type: string
    title: string
    description: string
    company: string
    companyId?: string
    contact?: string
    contactId?: string
    score: number
    priority: string
    confidence: number
    metadata?: any
  }) {
    try {
      const record = await base(tables.signals).create({
        'Signal Type': data.type,
        'Title': data.title,
        'Description': data.description,
        'Company Name': data.company,
        'Company ID': data.companyId ? [data.companyId] : [],
        'Contact Name': data.contact || '',
        'Contact ID': data.contactId ? [data.contactId] : [],
        'Score': data.score,
        'Priority': data.priority,
        'Confidence': data.confidence,
        'Metadata': JSON.stringify(data.metadata || {}),
        'Created At': new Date().toISOString(),
        'Updated At': new Date().toISOString()
      });
      
      return { success: true, data: record };
    } catch (error) {
      console.error('Error creating signal:', error);
      return { success: false, error: error };
    }
  },

  // Get recent signals
  async findRecent(limit: number = 50) {
    try {
      const records = await base(tables.signals).select({
        maxRecords: limit,
        sort: [{ field: 'Created At', direction: 'desc' }]
      }).all();
      
      return { 
        success: true, 
        data: records.map(record => ({
        id: record.id,
        ...record.fields,
        metadata: record.fields.Metadata ? JSON.parse(record.fields.Metadata as string) : {}
        }))
      };
    } catch (error) {
      console.error('Error fetching recent signals:', error);
      return { success: false, error: error };
    }
  }
};

// Research operations
export const researchOperations = {
  // Create a new research record
  async create(data: {
    query: string
    context: string
    summary: string
    insights: any[]
    recommendations: any[]
    talentGuardScore: number
    buyingProbability: number
    companyId?: string
    contactId?: string
  }) {
    try {
      const record = await base(tables.research).create({
        'Query': data.query,
        'Context': data.context,
        'Summary': data.summary,
        'Insights': JSON.stringify(data.insights),
        'Recommendations': JSON.stringify(data.recommendations),
        'TalentGuard Score': data.talentGuardScore,
        'Buying Probability': data.buyingProbability,
        'Company ID': data.companyId ? [data.companyId] : [],
        'Contact ID': data.contactId ? [data.contactId] : [],
        'Created At': new Date().toISOString(),
        'Updated At': new Date().toISOString()
      });
      
      return { success: true, data: record };
    } catch (error) {
      console.error('Error creating research record:', error);
      return { success: false, error: error };
    }
  }
};

// Activity tracking
export const activityOperations = {
  // Log activity
  async log(data: {
    type: string
    description: string
    companyId?: string
    contactId?: string
    metadata?: any
  }) {
    try {
      const record = await base(tables.activities).create({
        'Activity Type': data.type,
        'Description': data.description,
        'Company ID': data.companyId ? [data.companyId] : [],
        'Contact ID': data.contactId ? [data.contactId] : [],
        'Metadata': JSON.stringify(data.metadata || {}),
        'Created At': new Date().toISOString()
      });
      
      return { success: true, data: record };
    } catch (error) {
      console.error('Error logging activity:', error);
      return { success: false, error: error };
    }
  }
};