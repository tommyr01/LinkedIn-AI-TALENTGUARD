# URGENT: Fix "Failed to load contacts" Error

## The Problem
Your Vercel production environment has incorrect environment variables that are overriding the correct table IDs.

## The Solution
Go to your Vercel dashboard and update these environment variables:

### Step 1: Access Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Find your `linkedin-ai-talentguard` project
3. Click on it, then go to **Settings** → **Environment Variables**

### Step 2: Update These Variables
Find and update these environment variables to use the correct **table IDs** (not table names):

```
AIRTABLE_CONTACTS_TABLE=tbl78hVAHK199cm3o
AIRTABLE_SIGNALS_TABLE=tblwrCTx3MULl71uS
```

**Current (Wrong) Values:**
- `AIRTABLE_CONTACTS_TABLE=Contacts` ❌
- `AIRTABLE_SIGNALS_TABLE=Signals` ❌

**Correct Values:**
- `AIRTABLE_CONTACTS_TABLE=tbl78hVAHK199cm3o` ✅
- `AIRTABLE_SIGNALS_TABLE=tblwrCTx3MULl71uS` ✅

### Step 3: Redeploy
1. Go to the **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Wait for deployment to complete (usually 1-2 minutes)

### Step 4: Test
After redeployment, test these URLs:
- https://linked-in-ai-talentguard.vercel.app/api/contacts
- https://linked-in-ai-talentguard.vercel.app/api/accounts
- https://linked-in-ai-talentguard.vercel.app/dashboard/contacts
- https://linked-in-ai-talentguard.vercel.app/dashboard/companies

## Why This Happened
Vercel environment variables take precedence over hardcoded fallback values in the code. The variables were set with table names instead of table IDs, causing the API calls to fail.

## Verification
After the fix, you should see:
- ✅ Companies page loads with real data
- ✅ Contacts page loads with real data  
- ✅ No more "Failed to load contacts" error
- ✅ API endpoints return actual Airtable data

The data is already there and working (confirmed via direct Airtable API test) - it's just a configuration issue! 