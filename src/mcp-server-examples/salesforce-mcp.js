/**
 * Example MCP Server Implementation for Salesforce Integration
 * 
 * This file provides a template for how to create an MCP server that connects to Salesforce,
 * performs fuzzy matching on company names, and returns structured data for import into Airtable.
 * 
 * To use this, you would need to:
 * 1. Set up a server to run this code (Node.js, Docker, etc.)
 * 2. Install required dependencies (jsforce, fuzzyset.js, etc.)
 * 3. Configure environment variables for Salesforce credentials
 * 4. Expose the server via an API endpoint that your Next.js app can access
 */

const express = require('express');
const jsforce = require('jsforce');
const FuzzySet = require('fuzzyset.js');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Salesforce credentials from environment variables
const SF_LOGIN_URL = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';
const SF_USERNAME = process.env.SF_USERNAME;
const SF_PASSWORD = process.env.SF_PASSWORD;
const SF_TOKEN = process.env.SF_TOKEN;

// Create a connection to Salesforce
const conn = new jsforce.Connection({
  loginUrl: SF_LOGIN_URL
});

// Login to Salesforce
async function loginToSalesforce() {
  if (!SF_USERNAME || !SF_PASSWORD) {
    throw new Error('Salesforce credentials not configured');
  }
  
  try {
    await conn.login(SF_USERNAME, SF_PASSWORD + (SF_TOKEN || ''));
    console.log('Connected to Salesforce');
  } catch (error) {
    console.error('Salesforce login error:', error);
    throw error;
  }
}

// API endpoint to search for companies
app.post('/api/salesforce', async (req, res) => {
  try {
    const { query, fuzzyMatch = true, extractContacts = true, extractActivities = true } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Ensure we're logged in to Salesforce
    if (!conn.accessToken) {
      await loginToSalesforce();
    }
    
    // Search for accounts in Salesforce
    const accountsResult = await searchAccounts(query, fuzzyMatch);
    
    if (accountsResult.length === 0) {
      return res.status(404).json({ error: 'No matching companies found' });
    }
    
    // Get the best match
    const bestMatch = accountsResult[0];
    
    // Format the company data
    const companyData = formatCompanyData(bestMatch);
    
    // Get related data if requested
    let contactsData = [];
    let activitiesData = [];
    
    if (extractContacts) {
      contactsData = await getContacts(bestMatch.Id);
    }
    
    if (extractActivities) {
      activitiesData = await getActivities(bestMatch.Id);
    }
    
    // Return the combined data
    res.json({
      company: companyData,
      contacts: contactsData,
      activities: activitiesData
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search for accounts in Salesforce with fuzzy matching
async function searchAccounts(query, fuzzyMatch) {
  // First, try an exact match
  const exactQuery = `SELECT Id, Name, Industry, Description, Website, BillingCity, 
                     BillingState, BillingCountry, NumberOfEmployees, AnnualRevenue 
                     FROM Account WHERE Name = '${query}' LIMIT 1`;
  
  let result = await conn.query(exactQuery);
  
  // If no exact match and fuzzy matching is enabled
  if (result.totalSize === 0 && fuzzyMatch) {
    // Get a list of accounts to compare against
    const listQuery = "SELECT Id, Name FROM Account LIMIT 1000";
    const accounts = await conn.query(listQuery);
    
    if (accounts.totalSize > 0) {
      // Create a fuzzy set with account names
      const accountNames = accounts.records.map(record => record.Name);
      const fuzzySet = FuzzySet(accountNames);
      
      // Find the best matches
      const matches = fuzzySet.get(query);
      
      if (matches && matches.length > 0) {
        // Get the best match with score above threshold (e.g., 0.7)
        const bestMatches = matches.filter(match => match[0] > 0.7);
        
        if (bestMatches.length > 0) {
          const bestMatchName = bestMatches[0][1];
          
          // Find the account ID for this name
          const matchedAccount = accounts.records.find(record => record.Name === bestMatchName);
          
          if (matchedAccount) {
            // Get full details for this account
            const detailQuery = `SELECT Id, Name, Industry, Description, Website, BillingCity, 
                                BillingState, BillingCountry, NumberOfEmployees, AnnualRevenue 
                                FROM Account WHERE Id = '${matchedAccount.Id}'`;
            
            result = await conn.query(detailQuery);
          }
        }
      }
    }
  }
  
  return result.records;
}

// Get contacts related to an account
async function getContacts(accountId) {
  const query = `SELECT Id, FirstName, LastName, Email, Phone, Title 
                FROM Contact WHERE AccountId = '${accountId}'`;
  
  const result = await conn.query(query);
  
  return result.records.map(record => formatContactData(record, accountId));
}

// Get activities related to an account
async function getActivities(accountId) {
  // Tasks
  const tasksQuery = `SELECT Id, Subject, Description, ActivityDate, Status, Type 
                     FROM Task WHERE WhatId = '${accountId}' 
                     ORDER BY ActivityDate DESC LIMIT 50`;
  
  const tasksResult = await conn.query(tasksQuery);
  
  // Events
  const eventsQuery = `SELECT Id, Subject, Description, StartDateTime, EndDateTime, Type 
                      FROM Event WHERE WhatId = '${accountId}' 
                      ORDER BY StartDateTime DESC LIMIT 50`;
  
  const eventsResult = await conn.query(eventsQuery);
  
  // Combine and format
  const activities = [
    ...tasksResult.records.map(record => formatActivityData(record, 'Task', accountId)),
    ...eventsResult.records.map(record => formatActivityData(record, 'Event', accountId))
  ];
  
  // Sort by date (most recent first)
  return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Format company data for Airtable
function formatCompanyData(sfAccount) {
  let location = '';
  if (sfAccount.BillingCity) location += sfAccount.BillingCity;
  if (sfAccount.BillingState) {
    if (location) location += ', ';
    location += sfAccount.BillingState;
  }
  if (sfAccount.BillingCountry) {
    if (location) location += ', ';
    location += sfAccount.BillingCountry;
  }
  
  // Extract domain from website
  let domain = '';
  if (sfAccount.Website) {
    try {
      const url = new URL(sfAccount.Website);
      domain = url.hostname.replace('www.', '');
    } catch (e) {
      domain = sfAccount.Website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
    }
  }
  
  // Format revenue range
  let revenueRange = '';
  if (sfAccount.AnnualRevenue) {
    const revenue = parseFloat(sfAccount.AnnualRevenue);
    if (revenue < 1000000) revenueRange = 'Under $1M';
    else if (revenue < 10000000) revenueRange = '$1M-$10M';
    else if (revenue < 100000000) revenueRange = '$10M-$100M';
    else if (revenue < 1000000000) revenueRange = '$100M-$1B';
    else revenueRange = 'Over $1B';
  }
  
  return {
    name: sfAccount.Name,
    domain: domain,
    industry: sfAccount.Industry || '',
    description: sfAccount.Description || '',
    isTgCustomer: false, // Default to false, would need additional logic to determine
    website: sfAccount.Website || '',
    location: location,
    employeeCount: sfAccount.NumberOfEmployees || 0,
    revenueRange: revenueRange,
    salesforceId: sfAccount.Id
  };
}

// Format contact data for Airtable
function formatContactData(sfContact, accountId) {
  return {
    name: `${sfContact.FirstName || ''} ${sfContact.LastName || ''}`.trim(),
    email: sfContact.Email || '',
    title: sfContact.Title || '',
    phone: sfContact.Phone || '',
    salesforceId: sfContact.Id,
    roleCategory: determineRoleCategory(sfContact.Title || '')
  };
}

// Format activity data for Airtable
function formatActivityData(sfActivity, activityType, accountId) {
  let date = null;
  
  if (activityType === 'Task') {
    date = sfActivity.ActivityDate;
  } else if (activityType === 'Event') {
    date = sfActivity.StartDateTime;
  }
  
  return {
    type: activityType,
    subject: sfActivity.Subject || '',
    description: sfActivity.Description || '',
    date: date,
    salesforceId: sfActivity.Id,
    // Determine importance and sentiment with simple heuristics
    importance: determineImportance(sfActivity.Subject, sfActivity.Description),
    sentiment: determineSentiment(sfActivity.Subject, sfActivity.Description)
  };
}

// Simple heuristic to determine role category from title
function determineRoleCategory(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('ceo') || titleLower.includes('cto') || titleLower.includes('cfo') || 
      titleLower.includes('chief') || titleLower.includes('president') || titleLower.includes('founder')) {
    return 'Exec Sponsor';
  }
  
  if (titleLower.includes('vp') || titleLower.includes('vice president') || 
      titleLower.includes('director') || titleLower.includes('head of')) {
    return 'Champion';
  }
  
  if (titleLower.includes('manager') || titleLower.includes('lead')) {
    return 'Buyer';
  }
  
  if (titleLower.includes('engineer') || titleLower.includes('architect') || 
      titleLower.includes('developer') || titleLower.includes('admin')) {
    return 'Tech Validator';
  }
  
  return 'Other';
}

// Simple heuristic to determine importance from activity text
function determineImportance(subject, description) {
  const text = `${subject} ${description}`.toLowerCase();
  
  if (text.includes('urgent') || text.includes('critical') || text.includes('high priority') || 
      text.includes('decision') || text.includes('contract') || text.includes('signed')) {
    return 'High';
  }
  
  if (text.includes('follow up') || text.includes('meeting') || 
      text.includes('call') || text.includes('demo')) {
    return 'Medium';
  }
  
  return 'Low';
}

// Simple heuristic to determine sentiment from activity text
function determineSentiment(subject, description) {
  const text = `${subject} ${description}`.toLowerCase();
  
  const positiveWords = ['interested', 'excited', 'positive', 'good', 'great', 'excellent', 'happy', 'agreed'];
  const negativeWords = ['concerned', 'issue', 'problem', 'not interested', 'negative', 'bad', 'unhappy', 'rejected'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (text.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (text.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'Positive';
  if (negativeCount > positiveCount) return 'Negative';
  return 'Neutral';
}

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Salesforce MCP server running on port ${PORT}`);
});

/**
 * To use this MCP server:
 * 
 * 1. Save this file to a server that can run Node.js
 * 2. Create a .env file with your Salesforce credentials:
 *    SF_LOGIN_URL=https://login.salesforce.com
 *    SF_USERNAME=your-salesforce-username
 *    SF_PASSWORD=your-salesforce-password
 *    SF_TOKEN=your-salesforce-security-token
 * 
 * 3. Install dependencies:
 *    npm install express jsforce fuzzyset.js cors body-parser
 * 
 * 4. Run the server:
 *    node salesforce-mcp.js
 * 
 * 5. Configure your Next.js app to use this endpoint:
 *    MCP_SALESFORCE_ENDPOINT=http://your-server:3001/api/salesforce
 */ 