# TalentGuard Buyer Intelligence Platform

An AI-powered buyer intelligence platform designed to help TalentGuard's sales and marketing teams identify and engage buying committee members 10x faster than manual research.

## Features

- 🔍 **Company Search** - Find target companies and identify buying committee members
- 🧠 **AI-Powered Enrichment** - LinkedIn profile scraping and web research integration
- 📊 **Signal Intelligence** - TalentGuard-specific scoring algorithm to prioritize prospects
- 🔄 **Salesforce Integration** - One-click sync of enriched contact data
- 🎯 **Buying Committee Mapping** - Complete stakeholder identification across HR, IT, Finance, and Operations

## Technology Stack

- **Frontend**: Next.js 15 with App Router
- **UI Components**: shadcn/ui (New York style)
- **Database**: Airtable for MVP
- **AI Services**: OpenAI GPT-4 for analysis, Perplexity for web research
- **CRM Integration**: Salesforce API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- API keys for OpenAI, Perplexity, Airtable, and Salesforce

### Installation

1. Clone the repository:
```bash
git clone https://github.com/tommyr01/LinkedIn-AI-TALENTGUARD.git
cd LinkedIn-AI-TALENTGUARD
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Then edit `.env.local` with your actual API keys.

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

Required environment variables (see `.env.example`):

- `OPENAI_API_KEY` - OpenAI API key for signal analysis
- `PERPLEXITY_API_KEY` - Perplexity API key for web research
- `AIRTABLE_API_KEY` - Airtable API key for data storage
- `AIRTABLE_BASE_ID` - Airtable base ID
- `SALESFORCE_CLIENT_ID` - Salesforce OAuth client ID
- `SALESFORCE_CLIENT_SECRET` - Salesforce OAuth client secret
- `SALESFORCE_USERNAME` - Salesforce username
- `SALESFORCE_PASSWORD` - Salesforce password
- `SALESFORCE_SECURITY_TOKEN` - Salesforce security token

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Dashboard pages
│   ├── api/              # API routes
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   └── ...              # Custom components
├── lib/                 # Utility functions
├── hooks/               # Custom React hooks
└── types/               # TypeScript type definitions
```

## Features Overview

### Company Search
- Search by company name or domain
- Filter by industry, size, and location
- Identify buying committee members across departments

### Contact Enrichment
- LinkedIn profile data extraction
- Web research via Perplexity integration
- Career history and activity analysis

### Signal Intelligence
- TalentGuard-specific scoring algorithm
- Signals include: recent job changes, HR transformation keywords, AI/automation interest
- Prioritization based on buying readiness

### Salesforce Integration
- One-click contact sync
- Automatic field mapping
- Duplicate detection and handling

## Development

### Build Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## License

This project is proprietary to TalentGuard and not open source.

## Support

For support, contact the development team or create an issue in this repository.