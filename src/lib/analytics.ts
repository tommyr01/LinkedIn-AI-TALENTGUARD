// Analytics tracking utilities for TalentGuard Buyer Intelligence

export interface AnalyticsEvent {
  event_name: string
  user_id?: string
  session_id?: string
  properties?: Record<string, any>
  page_url?: string
}

export interface UserProperties {
  user_id: string
  email?: string
  name?: string
  company?: string
  role?: string
  subscription_tier?: string
  signup_date?: string
}

class AnalyticsService {
  private sessionId: string
  private userId?: string
  private isEnabled: boolean

  constructor() {
    this.sessionId = this.generateSessionId()
    this.isEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true'
    
    // Load user ID from localStorage if available
    if (typeof window !== 'undefined') {
      this.userId = localStorage.getItem('analytics_user_id') || undefined
    }
  }

  private generateSessionId(): string {
    if (typeof window !== 'undefined') {
      // Try to get existing session ID
      let sessionId = sessionStorage.getItem('analytics_session_id')
      
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('analytics_session_id', sessionId)
      }
      
      return sessionId
    }
    
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Set user identity for tracking
  public identify(userId: string, properties?: Partial<UserProperties>): void {
    this.userId = userId
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_user_id', userId)
    }
    
    if (properties) {
      this.track('user_identified', properties)
    }
  }

  // Track an event
  public async track(eventName: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled) return

    const event: AnalyticsEvent = {
      event_name: eventName,
      user_id: this.userId,
      session_id: this.sessionId,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      },
      page_url: typeof window !== 'undefined' ? window.location.href : undefined
    }

    try {
      // Send to our analytics endpoint
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }

  // Track page view
  public trackPageView(pageName?: string): void {
    if (!this.isEnabled) return

    const properties: Record<string, any> = {}
    
    if (typeof window !== 'undefined') {
      properties.page_title = document.title
      properties.page_path = window.location.pathname
      properties.page_search = window.location.search
      properties.page_hash = window.location.hash
    }
    
    if (pageName) {
      properties.page_name = pageName
    }

    this.track('page_view', properties)
  }

  // Track user registration
  public trackRegistration(method: string, userProperties?: Partial<UserProperties>): void {
    this.track('user_registered', {
      registration_method: method,
      ...userProperties
    })
  }

  // Track user login
  public trackLogin(method: string): void {
    this.track('user_logged_in', {
      login_method: method
    })
  }

  // Track user logout
  public trackLogout(): void {
    this.track('user_logged_out')
    
    // Clear user ID
    this.userId = undefined
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analytics_user_id')
    }
  }

  // Track feature usage
  public trackFeatureUsed(featureName: string, properties?: Record<string, any>): void {
    this.track('feature_used', {
      feature_name: featureName,
      ...properties
    })
  }

  // Track business events
  public trackConnection(action: 'created' | 'updated' | 'deleted', connectionId: string): void {
    this.track('connection_action', {
      action,
      connection_id: connectionId
    })
  }

  public trackResearch(type: 'web' | 'linkedin', connectionId: string, success: boolean): void {
    this.track('research_completed', {
      research_type: type,
      connection_id: connectionId,
      success
    })
  }

  public trackToneProfile(action: 'created' | 'updated' | 'deleted' | 'used', profileId: string): void {
    this.track('tone_profile_action', {
      action,
      profile_id: profileId
    })
  }

  public trackAIGeneration(type: 'email' | 'message' | 'post', toneProfileId?: string, success: boolean = true): void {
    this.track('ai_content_generated', {
      content_type: type,
      tone_profile_id: toneProfileId,
      success
    })
  }

  public trackSubscription(action: 'upgraded' | 'downgraded' | 'cancelled', tier: string): void {
    this.track('subscription_changed', {
      action,
      tier
    })
  }

  // Track errors
  public trackError(errorType: string, errorMessage: string, context?: Record<string, any>): void {
    this.track('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      ...context
    })
  }

  // Track performance metrics
  public trackPerformance(metricName: string, value: number, unit: string = 'ms'): void {
    this.track('performance_metric', {
      metric_name: metricName,
      value,
      unit
    })
  }

  // Track conversion funnel
  public trackFunnelStep(funnelName: string, stepName: string, stepIndex: number): void {
    this.track('funnel_step', {
      funnel_name: funnelName,
      step_name: stepName,
      step_index: stepIndex
    })
  }

  // Utility methods
  public getUserId(): string | undefined {
    return this.userId
  }

  public getSessionId(): string {
    return this.sessionId
  }

  public isTrackingEnabled(): boolean {
    return this.isEnabled
  }
}

// Export singleton instance
export const analytics = new AnalyticsService()

// React Hook for analytics
import { useEffect } from 'react'

export function useAnalytics() {
  useEffect(() => {
    // Track page view on component mount
    analytics.trackPageView()
  }, [])

  return analytics
}

// Higher-order component for automatic page tracking
export function withAnalytics<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function AnalyticsWrapper(props: T) {
    useAnalytics()
    return <WrappedComponent {...props} />
  }
}

// Predefined event tracking functions for common actions
export const trackEvent = {
  // Authentication
  signUp: (method: string) => analytics.trackRegistration(method),
  signIn: (method: string) => analytics.trackLogin(method),
  signOut: () => analytics.trackLogout(),

  // Feature usage
  searchCompanies: (query: string, resultsCount: number) => 
    analytics.trackFeatureUsed('company_search', { query, results_count: resultsCount }),
  
  viewConnection: (connectionId: string) => 
    analytics.trackFeatureUsed('view_connection', { connection_id: connectionId }),
  
  createToneProfile: (profileId: string) => 
    analytics.trackToneProfile('created', profileId),
  
  generateContent: (type: 'email' | 'message' | 'post', profileId?: string) => 
    analytics.trackAIGeneration(type, profileId),
  
  startResearch: (type: 'web' | 'linkedin', connectionId: string) => 
    analytics.trackFeatureUsed('start_research', { research_type: type, connection_id: connectionId }),
  
  // Business metrics
  addConnection: (connectionId: string, source: string) => {
    analytics.trackConnection('created', connectionId)
    analytics.trackFeatureUsed('add_connection', { source })
  },
  
  exportData: (dataType: string, format: string) => 
    analytics.trackFeatureUsed('export_data', { data_type: dataType, format }),
  
  // Engagement
  openSettings: () => analytics.trackFeatureUsed('open_settings'),
  useTemplate: (templateId: string) => analytics.trackFeatureUsed('use_template', { template_id: templateId }),
  shareContent: (contentType: string, method: string) => 
    analytics.trackFeatureUsed('share_content', { content_type: contentType, method }),
  
  // Errors
  apiError: (endpoint: string, errorCode: number) => 
    analytics.trackError('api_error', `${endpoint} returned ${errorCode}`, { endpoint, error_code: errorCode }),
  
  javascriptError: (error: Error) => 
    analytics.trackError('javascript_error', error.message, { stack: error.stack })
}