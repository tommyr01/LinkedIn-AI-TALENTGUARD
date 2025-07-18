// Company Types
export interface Company {
  id: string
  name: string
  domain: string
  industry?: string
  employee_count?: number
  location?: string
  linkedin_url?: string
  last_enriched?: Date
  contacts?: Contact[]
}

// Contact Types
export interface Contact {
  id: string
  first_name: string
  last_name: string
  title: string
  department: Department
  company_id: string
  company?: Company
  linkedin_url?: string
  email?: string
  signal_score: number
  signals: Signal[]
  profile_data?: LinkedInProfile
  research_data?: WebResearch
  salesforce_id?: string
  last_synced?: Date
  created_at: Date
}

// Signal Types
export interface Signal {
  id: string
  name: string
  description: string
  weight: number
  category: SignalCategory
  active: boolean
}

export interface ContactSignal {
  signal_id: string
  signal: Signal
  contact_id: string
  detected_at: Date
  confidence: number
  evidence?: string
}

// LinkedIn Profile Types
export interface LinkedInProfile {
  current_title?: string
  current_company?: string
  career_history?: CareerHistory[]
  education?: Education[]
  skills?: string[]
  recent_activity?: LinkedInActivity[]
  connection_count?: number
  profile_picture?: string
  summary?: string
}

export interface CareerHistory {
  company: string
  title: string
  duration: string
  start_date?: Date
  end_date?: Date
  description?: string
}

export interface Education {
  school: string
  degree?: string
  field?: string
  graduation_year?: number
}

export interface LinkedInActivity {
  type: 'post' | 'comment' | 'share'
  content: string
  date: Date
  engagement?: number
}

// Web Research Types
export interface WebResearch {
  news_mentions?: NewsMention[]
  articles?: Article[]
  conference_speaking?: ConferenceSpeaking[]
  company_announcements?: CompanyAnnouncement[]
  professional_affiliations?: string[]
  last_updated: Date
}

export interface NewsMention {
  title: string
  url: string
  source: string
  date: Date
  summary: string
}

export interface Article {
  title: string
  url: string
  publication: string
  date: Date
  summary: string
}

export interface ConferenceSpeaking {
  event_name: string
  topic: string
  date: Date
  location?: string
}

export interface CompanyAnnouncement {
  title: string
  content: string
  date: Date
  source: string
}

// API Response Types
export interface CompanySearchResponse {
  companies: Company[]
  total: number
  page: number
  per_page: number
}

export interface ContactEnrichmentResponse {
  contact: Contact
  success: boolean
  message?: string
}

export interface SignalCalculationResponse {
  signal_score: number
  signals: ContactSignal[]
  breakdown: SignalBreakdown[]
}

export interface SignalBreakdown {
  signal: Signal
  points: number
  evidence: string
}

export interface SalesforceSync {
  success: boolean
  salesforce_id?: string
  message?: string
  errors?: string[]
}

// Enums
export enum Department {
  HR = 'HR',
  IT = 'IT',
  FINANCE = 'Finance',
  OPERATIONS = 'Operations',
  MARKETING = 'Marketing',
  SALES = 'Sales',
  EXECUTIVE = 'Executive',
  LEGAL = 'Legal',
  OTHER = 'Other'
}

export enum SignalCategory {
  JOB_CHANGE = 'Job Change',
  COMPANY_GROWTH = 'Company Growth',
  TECHNOLOGY_INTEREST = 'Technology Interest',
  COMPLIANCE = 'Compliance',
  TRANSFORMATION = 'Transformation',
  ENGAGEMENT = 'Engagement',
  PREVIOUS_INTERACTION = 'Previous Interaction'
}

export enum SearchFilterType {
  COMPANY_SIZE = 'company_size',
  INDUSTRY = 'industry',
  LOCATION = 'location',
  DEPARTMENT = 'department',
  SENIORITY = 'seniority'
}

// Search and Filter Types
export interface SearchFilters {
  min_employees?: number
  max_employees?: number
  industries?: string[]
  locations?: string[]
  departments?: Department[]
  min_signal_score?: number
}

export interface CompanySearchRequest {
  query: string
  filters?: SearchFilters
  page?: number
  per_page?: number
}

export interface ContactEnrichmentRequest {
  linkedin_url: string
  company_id: string
  force_refresh?: boolean
}

export interface SalesforceSyncRequest {
  contact_id: string
  force_update?: boolean
}