// Script to set up environment variables for TalentGuard Buyer Intelligence
const fs = require('fs');
const path = require('path');

const envContent = `# Airtable configuration
AIRTABLE_API_KEY=patIyuzOzrS9vFURu.ef38274eb40ebcee3b9ee9934be42e52a28f3bd006f4033df49fdca5fb3577a3
AIRTABLE_BASE_ID=appzgiUWBCdh58x00
AIRTABLE_COMPANIES_TABLE=tblJOd8XlW2sT0BQ6
AIRTABLE_CONTACTS_TABLE=
AIRTABLE_SIGNALS_TABLE=
AIRTABLE_RESEARCH_TABLE=
AIRTABLE_ACTIVITIES_TABLE=

# View ID if needed
AIRTABLE_VIEW_ID=viwTtqrrGe6ecguk3

# Other API keys
OPENAI_API_KEY=
PERPLEXITY_API_KEY=
`;

const envPath = path.join(__dirname, '.env.local');

// Write the file
fs.writeFileSync(envPath, envContent);

console.log('\x1b[32m%s\x1b[0m', '✅ .env.local file created successfully!');
console.log('\x1b[36m%s\x1b[0m', 'Environment variables for Airtable have been set up.');
console.log('You can now run the application with:');
console.log('\x1b[33m%s\x1b[0m', '  npm run dev'); 