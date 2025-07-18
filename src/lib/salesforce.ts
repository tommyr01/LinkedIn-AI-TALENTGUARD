// Salesforce integration for TalentGuard Buyer Intelligence
// This module handles all Salesforce operations for CRM sync and lead management

import { Connection } from 'jsforce'

// Salesforce connection configuration
const getSalesforceConnection = () => {
  const conn = new Connection({
    loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
    version: '58.0'
  })
  
  return conn
}

// Authenticate with Salesforce
export const authenticateSalesforce = async () => {
  const conn = getSalesforceConnection()
  
  try {
    const loginResult = await conn.login(
      process.env.SALESFORCE_USERNAME || '',
      (process.env.SALESFORCE_PASSWORD || '') + (process.env.SALESFORCE_SECURITY_TOKEN || '')
    )
    
    return { success: true, data: loginResult }
  } catch (error) {
    console.error('Salesforce authentication error:', error)
    return { success: false, error: error }
  }
}

// Account operations (Companies)
export const accountOperations = {
  // Create a new account
  async create(data: {
    name: string
    website?: string
    industry?: string
    numberOfEmployees?: number
    billingCity?: string
    billingState?: string
    billingCountry?: string
    description?: string
    talentGuardScore?: number
    buyingSignals?: number
  }) {
    const conn = getSalesforceConnection()
    
    try {
      await authenticateSalesforce()
      
      const result = await conn.sobject('Account').create({
        Name: data.name,
        Website: data.website || '',
        Industry: data.industry || '',
        NumberOfEmployees: data.numberOfEmployees || 0,
        BillingCity: data.billingCity || '',
        BillingState: data.billingState || '',
        BillingCountry: data.billingCountry || '',
        Description: data.description || '',
        TalentGuard_Score__c: data.talentGuardScore || 0,
        Buying_Signals__c: data.buyingSignals || 0,
        Type: 'Prospect',
        LeadSource: 'TalentGuard Platform'
      })
      
      return { success: true, data: result }
    } catch (error) {
      console.error('Error creating Salesforce account:', error)
      return { success: false, error: error }
    }
  },

  // Find account by name
  async findByName(name: string) {
    const conn = getSalesforceConnection()
    
    try {
      await authenticateSalesforce()
      
      const results = await conn.query(`
        SELECT Id, Name, Website, Industry, NumberOfEmployees, 
               BillingCity, BillingState, BillingCountry, Description,
               TalentGuard_Score__c, Buying_Signals__c, CreatedDate
        FROM Account 
        WHERE Name = '${name.replace(/'/g, "\\'")}'
        LIMIT 1
      `)
      
      return { 
        success: true, 
        data: results.records.length > 0 ? results.records[0] : null 
      }
    } catch (error) {
      console.error('Error finding Salesforce account:', error)
      return { success: false, error: error }
    }
  },

  // Update account
  async update(accountId: string, data: Partial<any>) {
    const conn = getSalesforceConnection()
    
    try {
      await authenticateSalesforce()
      
      const result = await conn.sobject('Account').update({
        Id: accountId,
        ...data
      })
      
      return { success: true, data: result }
    } catch (error) {
      console.error('Error updating Salesforce account:', error)
      return { success: false, error: error }
    }
  },

  // Get all accounts
  async findAll(limit: number = 100) {
    const conn = getSalesforceConnection()
    
    try {
      await authenticateSalesforce()
      
      const results = await conn.query(`
        SELECT Id, Name, Website, Industry, NumberOfEmployees, 
               BillingCity, BillingState, BillingCountry, Description,
               TalentGuard_Score__c, Buying_Signals__c, CreatedDate
        FROM Account 
        WHERE Type = 'Prospect'
        ORDER BY TalentGuard_Score__c DESC
        LIMIT ${limit}
      `)
      
      return { success: true, data: results.records }
    } catch (error) {
      console.error('Error fetching Salesforce accounts:', error)
      return { success: false, error: error }
    }
  }
}

// Contact operations
export const contactOperations = {
  // Create a new contact
  async create(data: {
    firstName: string
    lastName: string
    email: string
    title?: string
    phone?: string
    accountId?: string
    linkedin?: string
    talentGuardScore?: number
    buyingSignals?: number
  }) {
    const conn = getSalesforceConnection()
    
    try {
      await authenticateSalesforce()
      
      const result = await conn.sobject('Contact').create({
        FirstName: data.firstName,
        LastName: data.lastName,
        Email: data.email,
        Title: data.title || '',
        Phone: data.phone || '',
        AccountId: data.accountId || '',
        LinkedIn_URL__c: data.linkedin || '',
        TalentGuard_Score__c: data.talentGuardScore || 0,
        Buying_Signals__c: data.buyingSignals || 0,
        LeadSource: 'TalentGuard Platform'
      })
      
      return { success: true, data: result }
    } catch (error) {
      console.error('Error creating Salesforce contact:', error)
      return { success: false, error: error }
    }
  },

  // Find contact by email
  async findByEmail(email: string) {
    const conn = getSalesforceConnection()
    
    try {
      await authenticateSalesforce()
      
      const results = await conn.query(`
        SELECT Id, FirstName, LastName, Email, Title, Phone, AccountId, 
               LinkedIn_URL__c, TalentGuard_Score__c, Buying_Signals__c, CreatedDate
        FROM Contact 
        WHERE Email = '${email.replace(/'/g, "\\'")}'
        LIMIT 1
      `)
      
      return { 
        success: true, 
        data: results.records.length > 0 ? results.records[0] : null 
      }
    } catch (error) {
      console.error('Error finding Salesforce contact:', error)
      return { success: false, error: error }
    }
  },

  // Get contacts for account
  async findByAccount(accountId: string) {
    const conn = getSalesforceConnection()
    
    try {
      await authenticateSalesforce()
      
      const results = await conn.query(`
        SELECT Id, FirstName, LastName, Email, Title, Phone, AccountId, 
               LinkedIn_URL__c, TalentGuard_Score__c, Buying_Signals__c, CreatedDate
        FROM Contact 
        WHERE AccountId = '${accountId}'
        ORDER BY TalentGuard_Score__c DESC
      `)
      
      return { success: true, data: results.records }
    } catch (error) {
      console.error('Error fetching account contacts:', error)
      return { success: false, error: error }
    }
  }
}

// Lead operations
export const leadOperations = {
  // Create a new lead
  async create(data: {
    firstName: string
    lastName: string
    email: string
    company: string
    title?: string
    phone?: string
    website?: string
    industry?: string
    talentGuardScore?: number
    buyingSignals?: number
  }) {
    const conn = getSalesforceConnection()
    
    try {
      await authenticateSalesforce()
      
      const result = await conn.sobject('Lead').create({
        FirstName: data.firstName,
        LastName: data.lastName,
        Email: data.email,
        Company: data.company,
        Title: data.title || '',
        Phone: data.phone || '',
        Website: data.website || '',
        Industry: data.industry || '',
        TalentGuard_Score__c: data.talentGuardScore || 0,
        Buying_Signals__c: data.buyingSignals || 0,
        LeadSource: 'TalentGuard Platform',
        Status: 'Open - Not Contacted'
      })
      
      return { success: true, data: result }
    } catch (error) {
      console.error('Error creating Salesforce lead:', error)
      return { success: false, error: error }
    }
  },

  // Convert lead to account and contact
  async convert(leadId: string, accountName?: string) {
    const conn = getSalesforceConnection()
    
    try {
      await authenticateSalesforce()
      
      // Use the correct JSForce method for lead conversion
      const result = await conn.apex.post('/services/data/v58.0/sobjects/LeadConvert/', {
        leadId: leadId,
        accountName: accountName,
        convertedStatus: 'Qualified'
      })
      
      return { success: true, data: result }
    } catch (error) {
      console.error('Error converting Salesforce lead:', error)
      return { success: false, error: error }
    }
  }
}

// Opportunity operations
export const opportunityOperations = {
  // Create a new opportunity
  async create(data: {
    name: string
    accountId: string
    stageName: string
    closeDate: string
    amount?: number
    probability?: number
    description?: string
    talentGuardScore?: number
  }) {
    const conn = getSalesforceConnection()
    
    try {
      await authenticateSalesforce()
      
      const result = await conn.sobject('Opportunity').create({
        Name: data.name,
        AccountId: data.accountId,
        StageName: data.stageName,
        CloseDate: data.closeDate,
        Amount: data.amount || 0,
        Probability: data.probability || 0,
        Description: data.description || '',
        TalentGuard_Score__c: data.talentGuardScore || 0,
        LeadSource: 'TalentGuard Platform'
      })
      
      return { success: true, data: result }
    } catch (error) {
      console.error('Error creating Salesforce opportunity:', error)
      return { success: false, error: error }
    }
  }
}

// Task operations for activity tracking
export const taskOperations = {
  // Create a new task
  async create(data: {
    subject: string
    description: string
    whoId?: string
    whatId?: string
    activityDate?: string
    status?: string
    priority?: string
  }) {
    const conn = getSalesforceConnection()
    
    try {
      await authenticateSalesforce()
      
      const result = await conn.sobject('Task').create({
        Subject: data.subject,
        Description: data.description,
        WhoId: data.whoId || '',
        WhatId: data.whatId || '',
        ActivityDate: data.activityDate || new Date().toISOString().split('T')[0],
        Status: data.status || 'Not Started',
        Priority: data.priority || 'Normal'
      })
      
      return { success: true, data: result }
    } catch (error) {
      console.error('Error creating Salesforce task:', error)
      return { success: false, error: error }
    }
  }
}

// Sync operations
export const syncOperations = {
  // Sync TalentGuard data to Salesforce
  async syncToSalesforce(data: {
    companies: any[]
    contacts: any[]
    signals: any[]
  }) {
    const results = {
      companies: [] as any[],
      contacts: [] as any[],
      activities: [] as any[]
    }
    
    try {
      // Sync companies as accounts
      for (const company of data.companies) {
        const accountResult = await accountOperations.create({
          name: company.name,
          website: company.website,
          industry: company.industry,
          numberOfEmployees: company.employees,
          billingCity: company.location?.split(',')[0],
          billingState: company.location?.split(',')[1]?.trim(),
          description: company.description,
          talentGuardScore: company.buyingSignals?.score || 0,
          buyingSignals: company.buyingSignals?.signals?.length || 0
        })
        
        results.companies.push(accountResult)
      }
      
      // Sync contacts
      for (const contact of data.contacts) {
        const [firstName, ...lastNameParts] = contact.name.split(' ')
        const lastName = lastNameParts.join(' ')
        
        const contactResult = await contactOperations.create({
          firstName: firstName,
          lastName: lastName,
          email: contact.email,
          title: contact.title,
          phone: contact.phone,
          linkedin: contact.linkedinUrl,
          talentGuardScore: contact.talentGuardScore || 0,
          buyingSignals: contact.buyingSignals || 0
        })
        
        results.contacts.push(contactResult)
      }
      
      // Sync signals as activities
      for (const signal of data.signals) {
        const taskResult = await taskOperations.create({
          subject: signal.title,
          description: signal.description,
          status: 'Completed',
          priority: signal.priority === 'urgent' ? 'High' : 'Normal'
        })
        
        results.activities.push(taskResult)
      }
      
      return { success: true, data: results }
    } catch (error) {
      console.error('Error syncing to Salesforce:', error)
      return { success: false, error: error }
    }
  }
}