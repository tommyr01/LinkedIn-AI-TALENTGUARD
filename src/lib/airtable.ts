// Airtable integration for TalentGuard Buyer Intelligence
// This module handles all Airtable operations for storing and retrieving data

import Airtable from 'airtable'

// Table names
export const TABLES = {
  COMPANIES: 'Companies',
  CONTACTS: 'Contacts',
  SIGNALS: 'Signals',
  RESEARCH: 'Research',
  ACTIVITIES: 'Activities'
} as const

// Get base instance (lazy initialization)
export const getBase = () => {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    throw new Error('Airtable API key and base ID are required')
  }
  
  const airtable = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY,
  })
  
  return airtable.base(process.env.AIRTABLE_BASE_ID)
}

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
    const base = getBase()
    
    try {
      const record = await base(TABLES.COMPANIES).create({
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
      })
      
      return { success: true, data: record }
    } catch (error) {
      console.error('Error creating company:', error)
      return { success: false, error: error }
    }
  },

  // Get all companies
  async findAll() {
    const base = getBase()
    
    try {
      const records = await base(TABLES.COMPANIES).select({
        maxRecords: 100,
        sort: [{ field: 'TalentGuard Score', direction: 'desc' }]
      }).all()
      
      return { success: true, data: records.map(record => ({
        id: record.id,
        ...record.fields
      })) }
    } catch (error) {
      console.error('Error fetching companies:', error)
      return { success: false, error: error }
    }
  },

  // Find company by domain
  async findByDomain(domain: string) {
    const base = getBase()
    
    try {
      const records = await base(TABLES.COMPANIES).select({
        filterByFormula: `{Domain} = "${domain}"`,
        maxRecords: 1
      }).all()
      
      return { 
        success: true, 
        data: records.length > 0 ? { id: records[0].id, ...records[0].fields } : null 
      }
    } catch (error) {
      console.error('Error finding company by domain:', error)
      return { success: false, error: error }
    }
  },

  // Update company record
  async update(recordId: string, data: Partial<any>) {
    const base = getBase()
    
    try {
      const record = await base(TABLES.COMPANIES).update(recordId, {
        ...data,
        'Updated At': new Date().toISOString()
      })
      
      return { success: true, data: record }
    } catch (error) {
      console.error('Error updating company:', error)
      return { success: false, error: error }
    }
  }
}

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
    const base = getBase()
    
    try {
      const record = await base(TABLES.CONTACTS).create({
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
      })
      
      return { success: true, data: record }
    } catch (error) {
      console.error('Error creating contact:', error)
      return { success: false, error: error }
    }
  },

  // Get all contacts
  async findAll() {
    const base = getBase()
    
    try {
      const records = await base(TABLES.CONTACTS).select({
        maxRecords: 100,
        sort: [{ field: 'TalentGuard Score', direction: 'desc' }]
      }).all()
      
      return { success: true, data: records.map(record => ({
        id: record.id,
        ...record.fields
      })) }
    } catch (error) {
      console.error('Error fetching contacts:', error)
      return { success: false, error: error }
    }
  },

  // Find contact by email
  async findByEmail(email: string) {
    const base = getBase()
    
    try {
      const records = await base(TABLES.CONTACTS).select({
        filterByFormula: `{Email} = "${email}"`,
        maxRecords: 1
      }).all()
      
      return { 
        success: true, 
        data: records.length > 0 ? { id: records[0].id, ...records[0].fields } : null 
      }
    } catch (error) {
      console.error('Error finding contact by email:', error)
      return { success: false, error: error }
    }
  }
}

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
    const base = getBase()
    
    try {
      const record = await base(TABLES.SIGNALS).create({
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
      })
      
      return { success: true, data: record }
    } catch (error) {
      console.error('Error creating signal:', error)
      return { success: false, error: error }
    }
  },

  // Get recent signals
  async findRecent(limit: number = 50) {
    const base = getBase()
    
    try {
      const records = await base(TABLES.SIGNALS).select({
        maxRecords: limit,
        sort: [{ field: 'Created At', direction: 'desc' }]
      }).all()
      
      return { success: true, data: records.map(record => ({
        id: record.id,
        ...record.fields,
        metadata: record.fields.Metadata ? JSON.parse(record.fields.Metadata as string) : {}
      })) }
    } catch (error) {
      console.error('Error fetching recent signals:', error)
      return { success: false, error: error }
    }
  }
}

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
    const base = getBase()
    
    try {
      const record = await base(TABLES.RESEARCH).create({
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
      })
      
      return { success: true, data: record }
    } catch (error) {
      console.error('Error creating research record:', error)
      return { success: false, error: error }
    }
  }
}

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
    const base = getBase()
    
    try {
      const record = await base(TABLES.ACTIVITIES).create({
        'Activity Type': data.type,
        'Description': data.description,
        'Company ID': data.companyId ? [data.companyId] : [],
        'Contact ID': data.contactId ? [data.contactId] : [],
        'Metadata': JSON.stringify(data.metadata || {}),
        'Created At': new Date().toISOString()
      })
      
      return { success: true, data: record }
    } catch (error) {
      console.error('Error logging activity:', error)
      return { success: false, error: error }
    }
  }
}