# Vercel Environment Variables Setup

You need to set these environment variables in your Vercel dashboard to fix the "Failed to load contacts" error:

## Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Find your `linkedin-ai-talentguard` project
3. Go to Settings → Environment Variables

## Add/Update These Variables:

```
AIRTABLE_API_KEY=patIyuzOzrS9vFURu.ef38274eb40ebcee3b9ee9934be42e52a28f3bd006f4033df49fdca5fb3577a3
AIRTABLE_BASE_ID=appzgiUWBCdh58x00
AIRTABLE_COMPANIES_TABLE=tblJOd8XlW2sT0BQ6
AIRTABLE_CONTACTS_TABLE=tbl78hVAHK199cm3o
AIRTABLE_SIGNALS_TABLE=tblwrCTx3MULl71uS
AIRTABLE_TASKS_TABLE=tbl7QneKQyiqAcN8B
```

## Important Notes:
- Make sure to set these for **Production**, **Preview**, and **Development** environments
- After adding/updating the variables, you need to **redeploy** the application
- You can trigger a redeploy by going to the Deployments tab and clicking "Redeploy" on the latest deployment

## Current Issue:
The production environment has old environment variables that are overriding our hardcoded fallbacks:
- `AIRTABLE_CONTACTS_TABLE` is set to `"Contacts"` (table name) instead of `"tbl78hVAHK199cm3o"` (table ID)
- `AIRTABLE_SIGNALS_TABLE` is set to `"Signals"` (table name) instead of `"tblwrCTx3MULl71uS"` (table ID)

## After Setting Variables:
1. Redeploy the application
2. Test the endpoints:
   - https://linked-in-ai-talentguard.vercel.app/api/test-airtable
   - https://linked-in-ai-talentguard.vercel.app/api/accounts
   - https://linked-in-ai-talentguard.vercel.app/api/contacts
3. Visit your app to see if the "Failed to load contacts" error is resolved 