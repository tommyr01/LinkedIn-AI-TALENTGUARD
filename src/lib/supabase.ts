// Supabase client and operations for TalentGuard Buyer Intelligence
import { createClient } from '@supabase/supabase-js'

// Database Types (matching actual Supabase schema)
export interface Company {
  id?: string
  name?: string
  domain?: string
  industry?: string
  tg_customer?: boolean
  current_news?: string
  last_signal_date?: string
  created_at?: string
}

export interface Contact {
  id?: string
  name?: string
  title?: string
  email?: string
  linkedin_url?: string
  role_category?: string
  account_id?: string // This is the foreign key to company
  created_at?: string
}

export interface Signal {
  id?: string
  source_url?: string
  date?: string
  type?: string
  summary?: string
  linked_contact_id?: string // Foreign key to contacts
  linked_account_id?: string // Foreign key to company
  days_since_signal?: number
  signal_impact?: string
  signal_sentiment?: string
  created_at?: string
}

export interface Task {
  id?: string
  task_name?: string
  task_type?: string
  status?: string
  due_date?: string
  owner?: string
  related_account_id?: string // Foreign key to company
  related_contact_id?: string // Foreign key to contacts
  days_until_due?: number
  task_priority?: string
  suggested_next_action?: string
  created_at?: string
}

export interface Research {
  id?: number // Auto-increment integer
  account_id?: string // Foreign key to company
  contact_id?: string // Foreign key to contacts
  topic?: string
  summary?: string
  source_url?: string
  insight_bullets?: string
  research_created_date?: string
  title?: string
  executive_summary?: string
  pdf_urls?: string
  top_opportunities?: string
  key_insights?: string
  created_at?: string
}

export interface Opportunity {
  id?: string
  title?: string
  need_statement?: string
  validation?: string
  product_mapping?: string
  chro_value?: string
  deal_accelerators?: string
  research_report_id?: number // Foreign key to research
  associated_company_id?: string // Foreign key to company
  created_at?: string
}

export interface Insight {
  id?: number // Auto-increment integer
  type?: string
  description?: string
  priority?: string
  direct_quotes?: string
  source?: string
  date?: string
  research_report_id?: number // Foreign key to research
  related_opportunity_id?: string // Foreign key to opportunities
  company_id?: string // Foreign key to company
  summary?: string
  tags?: string
  created_at?: string
}

// Database type mapping
export interface Database {
  public: {
    Tables: {
      company: {
        Row: Company
        Insert: Company
        Update: Partial<Company>
      }
      contacts: {
        Row: Contact
        Insert: Contact
        Update: Partial<Contact>
      }
      signals: {
        Row: Signal
        Insert: Signal
        Update: Partial<Signal>
      }
      tasks: {
        Row: Task
        Insert: Task
        Update: Partial<Task>
      }
      research: {
        Row: Research
        Insert: Research
        Update: Partial<Research>
      }
      opportunities: {
        Row: Opportunity
        Insert: Opportunity
        Update: Partial<Opportunity>
      }
      insights: {
        Row: Insight
        Insert: Insight
        Update: Partial<Insight>
      }
    }
  }
}

// Initialize Supabase client with build-safe configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create client with fallbacks for build-time safety
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co', // Fallback URL for build
  supabaseAnonKey || 'placeholder-key', // Fallback key for build
  {
    auth: {
      persistSession: false // Disable session persistence for server-side usage
    }
  }
)

// Runtime validation helper
export function validateSupabaseConfig(): { isValid: boolean; error?: string } {
  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    return {
      isValid: false,
      error: 'NEXT_PUBLIC_SUPABASE_URL environment variable is required'
    }
  }
  
  if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-key') {
    return {
      isValid: false,
      error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required'
    }
  }
  
  return { isValid: true }
}

// Helper to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return validateSupabaseConfig().isValid
}

// Company operations
export const companyOperations = {
  async create(data: Omit<Company, 'id' | 'created_at'>) {
    try {
      const { data: company, error } = await supabase
        .from('company')
        .insert({
          ...data,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data: company }
    } catch (error) {
      console.error('Error creating company:', error)
      return { success: false, error }
    }
  },

  async findAll() {
    try {
      const { data: companies, error } = await supabase
        .from('company')
        .select('*')
        .order('current_news', { ascending: false, nullsFirst: false })
        .limit(100)

      if (error) throw error
      return { success: true, data: companies }
    } catch (error) {
      console.error('Error fetching companies:', error)
      return { success: false, error }
    }
  },

  async getById(id: string) {
    try {
      const { data: company, error } = await supabase
        .from('company')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return { success: true, data: company }
    } catch (error) {
      console.error('Error finding company by ID:', error)
      return { success: false, error }
    }
  },

  async findByDomain(domain: string) {
    try {
      const { data: company, error } = await supabase
        .from('company')
        .select('*')
        .eq('domain', domain)
        .maybeSingle()

      if (error) throw error
      return { success: true, data: company }
    } catch (error) {
      console.error('Error finding company by domain:', error)
      return { success: false, error }
    }
  },

  async update(id: string, data: Partial<Company>) {
    try {
      const { data: company, error } = await supabase
        .from('company')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data: company }
    } catch (error) {
      console.error('Error updating company:', error)
      return { success: false, error }
    }
  }
}

// Contact operations
export const contactOperations = {
  async create(data: Omit<Contact, 'id' | 'created_at'>) {
    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          ...data,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data: contact }
    } catch (error) {
      console.error('Error creating contact:', error)
      return { success: false, error }
    }
  },

  async findAll() {
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return { success: true, data: contacts }
    } catch (error) {
      console.error('Error fetching contacts:', error)
      return { success: false, error }
    }
  },

  async getById(id: string) {
    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return { success: true, data: contact }
    } catch (error) {
      console.error('Error finding contact by ID:', error)
      return { success: false, error }
    }
  },

  async getByCompany(companyId: string) {
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('account_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data: contacts }
    } catch (error) {
      console.error('Error finding contacts by company:', error)
      return { success: false, error }
    }
  },

  async findByEmail(email: string) {
    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (error) throw error
      return { success: true, data: contact }
    } catch (error) {
      console.error('Error finding contact by email:', error)
      return { success: false, error }
    }
  },

  async update(id: string, data: Partial<Contact>) {
    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data: contact }
    } catch (error) {
      console.error('Error updating contact:', error)
      return { success: false, error }
    }
  }
}

// Signal operations
export const signalOperations = {
  async create(data: Omit<Signal, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: signal, error } = await supabase
        .from('signals')
        .insert({
          ...data,
          // metadata: data.metadata ? JSON.stringify(data.metadata) : null, // Commented out - field doesn't exist
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data: signal }
    } catch (error) {
      console.error('Error creating signal:', error)
      return { success: false, error }
    }
  },

  async findRecent(limit: number = 50) {
    try {
      const { data: signals, error } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      
      const parsedSignals = signals?.map(signal => ({
        ...signal,
        metadata: signal.metadata ? JSON.parse(signal.metadata as string) : {}
      }))

      return { success: true, data: parsedSignals }
    } catch (error) {
      console.error('Error fetching recent signals:', error)
      return { success: false, error }
    }
  },

  async getByCompany(companyId: string, options: { limit?: number } = {}) {
    try {
      const { data: signals, error } = await supabase
        .from('signals')
        .select('*')
        .eq('account_id', companyId)
        .order('created_at', { ascending: false })
        .limit(options.limit || 50)

      if (error) throw error
      
      const parsedSignals = signals?.map(signal => ({
        ...signal,
        metadata: signal.metadata ? JSON.parse(signal.metadata as string) : {}
      }))

      return { success: true, data: parsedSignals }
    } catch (error) {
      console.error('Error fetching signals by company:', error)
      return { success: false, error }
    }
  }
}

// Research operations
export const researchOperations = {
  async create(data: Omit<Research, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: research, error } = await supabase
        .from('research')
        .insert({
          ...data,
          // insights: data.insights ? JSON.stringify(data.insights) : null, // Commented out - field doesn't exist
          // recommendations: data.recommendations ? JSON.stringify(data.recommendations) : null, // Commented out - field doesn't exist
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data: research }
    } catch (error) {
      console.error('Error creating research record:', error)
      return { success: false, error }
    }
  }
}

// Task operations
export const taskOperations = {
  async create(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data: task }
    } catch (error) {
      console.error('Error creating task:', error)
      return { success: false, error }
    }
  },

  async findAll() {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true })
        .limit(100)

      if (error) throw error
      return { success: true, data: tasks }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      return { success: false, error }
    }
  },

  async update(id: string, data: Partial<Task>) {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data: task }
    } catch (error) {
      console.error('Error updating task:', error)
      return { success: false, error }
    }
  }
}

// Opportunity operations
export const opportunityOperations = {
  async create(data: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: opportunity, error } = await supabase
        .from('opportunities')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data: opportunity }
    } catch (error) {
      console.error('Error creating opportunity:', error)
      return { success: false, error }
    }
  }
}

// Insight operations
export const insightOperations = {
  async create(data: Omit<Insight, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: insight, error } = await supabase
        .from('insights')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data: insight }
    } catch (error) {
      console.error('Error creating insight:', error)
      return { success: false, error }
    }
  }
}

// Real-time subscriptions
export const subscriptions = {
  subscribeToCompanies(callback: (payload: any) => void) {
    return supabase
      .channel('company-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company' }, callback)
      .subscribe()
  },

  subscribeToSignals(callback: (payload: any) => void) {
    return supabase
      .channel('signal-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signals' }, callback)
      .subscribe()
  },

  subscribeToTasks(callback: (payload: any) => void) {
    return supabase
      .channel('task-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
      .subscribe()
  }
}