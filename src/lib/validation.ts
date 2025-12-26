import { z } from 'zod'

// ===================================================
// COMMON VALIDATION PATTERNS
// ===================================================

// Email validation
export const emailSchema = z.string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()

// Password validation
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format')

// URL validation
export const urlSchema = z.string()
  .url('Invalid URL format')
  .max(2048, 'URL must not exceed 2048 characters')

// LinkedIn URL validation
export const linkedinUrlSchema = z.string()
  .regex(
    /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/,
    'Invalid LinkedIn profile URL format'
  )

// LinkedIn post URL validation
export const linkedinPostUrlSchema = z.string()
  .regex(
    /^https:\/\/(www\.)?linkedin\.com\/feed\/update\/[a-zA-Z0-9:_-]+\/?$/,
    'Invalid LinkedIn post URL format'
  )

// Name validation
export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')

// Support ticket category validation
export const supportCategorySchema = z.enum([
  'bug',
  'feature_request', 
  'billing',
  'account',
  'technical',
  'general'
])

// Support ticket priority validation
export const supportPrioritySchema = z.enum([
  'low',
  'medium', 
  'high',
  'urgent'
])

// Support ticket status validation
export const supportStatusSchema = z.enum([
  'open',
  'in_progress',
  'resolved',
  'closed'
])

// Support ticket validation schema
export const supportTicketSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must not exceed 200 characters'),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  category: supportCategorySchema,
  browser_info: z.string().optional(),
  system_info: z.string().optional()
})

// Company name validation
export const companyNameSchema = z.string()
  .min(1, 'Company name is required')
  .max(200, 'Company name must not exceed 200 characters')
  .regex(/^[a-zA-Z0-9\s\-'\.&,]+$/, 'Company name contains invalid characters')

// Pagination validation
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).default('10'),
})

// Search query validation
export const searchQuerySchema = z.string()
  .max(255, 'Search query must not exceed 255 characters')
  .regex(/^[a-zA-Z0-9\s\-'\.@]+$/, 'Search query contains invalid characters')
  .optional()

// ===================================================
// AUTHENTICATION VALIDATION SCHEMAS
// ===================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: nameSchema,
  role: z.enum(['admin', 'user', 'viewer']).default('user'),
})

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: passwordSchema,
  confirm_password: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

// ===================================================
// USER MANAGEMENT VALIDATION SCHEMAS
// ===================================================

export const userUpdateSchema = z.object({
  full_name: nameSchema.optional(),
  role: z.enum(['admin', 'user', 'viewer']).optional(),
  is_active: z.boolean().optional(),
})

export const userPreferencesSchema = z.object({
  tone_profiles: z.array(z.object({
    id: z.string(),
    name: z.string().min(1).max(100),
    formality_level: z.enum(['professional', 'conversational', 'casual']),
    communication_style: z.enum(['direct', 'collaborative', 'consultative']),
    personality_traits: z.array(z.enum(['enthusiastic', 'analytical', 'supportive', 'authoritative'])),
    industry_language: z.enum(['hr_tech', 'leadership_development', 'sales', 'general']),
    custom_elements: z.string().max(500).optional(),
  })).max(10),
  default_tone_profile_id: z.string().optional(),
  ai_settings: z.object({
    openai_model: z.string().default('gpt-4'),
    temperature: z.number().min(0).max(2).default(0.7),
    max_tokens: z.number().min(1).max(4000).default(1000),
  }).default({}),
  notification_settings: z.object({
    email_notifications: z.boolean().default(true),
    research_complete: z.boolean().default(true),
    batch_complete: z.boolean().default(true),
  }).default({}),
})

// Enhanced tone profile schemas for the new database structure
export const toneProfileCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  formality_level: z.enum(['professional', 'conversational', 'casual']),
  communication_style: z.enum(['direct', 'collaborative', 'consultative']),
  personality_traits: z.array(z.enum(['enthusiastic', 'analytical', 'supportive', 'authoritative', 'empathetic', 'innovative'])).max(6),
  industry_language: z.enum(['hr_tech', 'leadership_development', 'sales', 'general', 'consulting']).default('general'),
  custom_elements: z.string().max(1000, 'Custom elements too long').optional(),
  sample_phrases: z.array(z.string().max(200)).max(10).default([]),
  avoid_words: z.array(z.string().max(50)).max(20).default([]),
  preferred_greetings: z.array(z.string().max(100)).max(5).default([]),
  preferred_closings: z.array(z.string().max(100)).max(5).default([]),
  ai_temperature: z.number().min(0).max(2).default(0.7),
  ai_max_tokens: z.number().min(50).max(4000).default(1000),
  ai_model: z.string().max(50).default('gpt-4'),
  is_default: z.boolean().default(false),
})

export const toneProfileUpdateSchema = toneProfileCreateSchema.partial().extend({
  id: z.string().uuid('Invalid tone profile ID'),
})

export const toneProfileUsageSchema = z.object({
  tone_profile_id: z.string().uuid(),
  usage_context: z.enum(['linkedin_comment', 'linkedin_reply', 'email_draft', 'general_content']),
  original_prompt: z.string().max(2000),
  generated_content: z.string().max(5000),
  final_content: z.string().max(5000).optional(),
  user_satisfaction_rating: z.number().int().min(1).max(5).optional(),
  edit_count: z.number().int().min(0).default(0),
  was_used: z.boolean().default(false),
  feedback_notes: z.string().max(1000).optional(),
})

// ===================================================
// LINKEDIN INTEGRATION VALIDATION SCHEMAS
// ===================================================

export const linkedinProfileSchema = z.object({
  username: z.string().min(1).max(100),
  full_name: nameSchema,
  first_name: nameSchema.optional(),
  last_name: nameSchema.optional(),
  headline: z.string().max(300).optional(),
  current_company: companyNameSchema.optional(),
  title: z.string().max(200).optional(),
  profile_url: linkedinUrlSchema.optional(),
  profile_picture_url: urlSchema.optional(),
  follower_count: z.number().int().min(0).optional(),
  connection_count: z.number().int().min(0).optional(),
})

export const linkedinPostSchema = z.object({
  post_url: linkedinPostUrlSchema,
  content: z.string().max(3000),
  author: z.string().min(1).max(100),
  post_date: z.string().datetime().optional(),
  likes_count: z.number().int().min(0).default(0),
  comments_count: z.number().int().min(0).default(0),
  shares_count: z.number().int().min(0).default(0),
})

export const linkedinCommentSchema = z.object({
  post_url: linkedinPostUrlSchema,
  comment_content: z.string().min(1).max(1000),
  author: z.string().min(1).max(100),
  comment_date: z.string().datetime().optional(),
})

// ===================================================
// INTELLIGENCE RESEARCH VALIDATION SCHEMAS
// ===================================================

export const researchRequestSchema = z.object({
  connection_id: uuidSchema,
  research_types: z.array(z.enum(['web_research', 'linkedin_analysis', 'combined'])).min(1),
  priority_level: z.enum(['low', 'medium', 'high']).default('medium'),
  custom_parameters: z.object({
    focus_areas: z.array(z.enum(['talent_management', 'people_development', 'hr_technology', 'leadership'])).optional(),
    depth_level: z.enum(['basic', 'standard', 'comprehensive']).default('standard'),
  }).optional(),
})

export const batchResearchRequestSchema = z.object({
  connection_ids: z.array(uuidSchema).min(1).max(50),
  priority_order: z.enum(['expertise_potential', 'engagement_level', 'company_relevance', 'random']).default('expertise_potential'),
  max_concurrency: z.number().int().min(1).max(5).default(3),
  research_types: z.array(z.enum(['web_research', 'linkedin_analysis', 'combined'])).min(1),
})

export const intelligenceScoreSchema = z.object({
  talent_management: z.number().int().min(0).max(100),
  people_development: z.number().int().min(0).max(100),
  hr_technology: z.number().int().min(0).max(100),
  leadership: z.number().int().min(0).max(100),
  overall_relevance: z.number().int().min(0).max(100),
  confidence_level: z.number().int().min(0).max(100),
})

// ===================================================
// AI CONTENT GENERATION VALIDATION SCHEMAS
// ===================================================

export const commentGenerationSchema = z.object({
  post_content: z.string().min(1).max(3000),
  target_audience: z.enum(['hr_professionals', 'executives', 'peers', 'general']).default('hr_professionals'),
  comment_style: z.enum(['supportive', 'analytical', 'questioning', 'sharing_experience']).default('supportive'),
  tone_profile_id: z.string().optional(),
  max_length: z.number().int().min(50).max(500).default(200),
  include_question: z.boolean().default(false),
})

export const contentAnalysisSchema = z.object({
  content: z.string().min(1).max(10000),
  analysis_type: z.enum(['sentiment', 'topics', 'expertise', 'engagement_potential']),
  context: z.object({
    platform: z.enum(['linkedin', 'web', 'email']).default('linkedin'),
    author_info: z.object({
      name: z.string().optional(),
      title: z.string().optional(),
      company: z.string().optional(),
    }).optional(),
  }).optional(),
})

export const commenterResearchSchema = z.object({
  profileUrl: linkedinUrlSchema,
  name: z.string().min(1).max(200).optional(),
  headline: z.string().max(300).optional(),
  forceRefresh: z.boolean().default(false), // Force refresh from LinkedIn API even if cached
})

export const linkedinReplySchema = z.object({
  commentId: z.string().min(1).max(500),
  commentUrl: z.string().url().optional(),
  replyText: z.string().min(1).max(1000).refine(text => text.trim().length > 0, {
    message: "Reply text cannot be empty or only whitespace"
  }),
  authorName: z.string().min(1).max(200).optional(),
  postUrl: z.string().url().optional(),
  toneProfileId: z.string().optional(), // For tone-aware replies
})

// ===================================================
// CRM INTEGRATION VALIDATION SCHEMAS
// ===================================================

export const salesforceContactSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  company: companyNameSchema,
  title: z.string().max(200).optional(),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  linkedin_url: linkedinUrlSchema.optional(),
  source: z.string().default('TalentGuard Intelligence Platform'),
})

export const opportunitySchema = z.object({
  name: z.string().min(1).max(255),
  account_name: companyNameSchema,
  stage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  amount: z.number().min(0).optional(),
  close_date: z.string().datetime(),
  description: z.string().max(1000).optional(),
})

// ===================================================
// COMPANY AND CONTACT VALIDATION SCHEMAS
// ===================================================

export const companySchema = z.object({
  name: companyNameSchema,
  domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/).optional(),
  industry: z.string().max(100).optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  location: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
})

export const contactSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  company_id: uuidSchema.optional(),
  company_name: companyNameSchema.optional(),
  title: z.string().max(200).optional(),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  linkedin_url: linkedinUrlSchema.optional(),
  notes: z.string().max(2000).optional(),
})

// ===================================================
// UTILITY FUNCTIONS
// ===================================================

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: z.ZodError
}

// Generic validation function
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): ValidationResult<T> {
  try {
    const data = schema.parse(input)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}

// Sanitize string input (remove potentially dangerous characters)
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent basic XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

// Sanitize HTML content (basic sanitization)
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim()
}

// Format validation errors for API responses
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(err.message)
  })
  
  return formatted
}

// Middleware helper for validating request bodies
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return async (request: Request): Promise<{ success: true; data: T } | { success: false; errors: Record<string, string[]> }> => {
    try {
      const body = await request.json()
      const result = validateInput(schema, body)
      
      if (result.success) {
        return { success: true, data: result.data! }
      } else {
        return { success: false, errors: formatValidationErrors(result.errors!) }
      }
    } catch (error) {
      return { 
        success: false, 
        errors: { body: ['Invalid JSON format'] } 
      }
    }
  }
}