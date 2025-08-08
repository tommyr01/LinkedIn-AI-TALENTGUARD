import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

export interface ToneProfile {
  id: string
  name: string
  description?: string
  formality_level: 'professional' | 'conversational' | 'casual'
  communication_style: 'direct' | 'collaborative' | 'consultative'
  personality_traits: string[]
  industry_language: string
  custom_elements?: string
  sample_phrases: string[]
  avoid_words: string[]
  preferred_greetings: string[]
  preferred_closings: string[]
  ai_temperature: number
  ai_max_tokens: number
  ai_model: string
  usage_count: number
  effectiveness_score: number
  last_used_at?: string
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ToneProfileTemplate {
  id: string
  name: string
  category: string
  description: string
  formality_level: string
  communication_style: string
  personality_traits: string[]
  industry_language: string
  custom_elements?: string
  sample_phrases: any[]
  is_premium: boolean
  usage_count: number
  popularity_score: number
}

export interface ToneProfileFormData {
  name: string
  description: string
  formality_level: 'professional' | 'conversational' | 'casual'
  communication_style: 'direct' | 'collaborative' | 'consultative'
  personality_traits: string[]
  industry_language: string
  custom_elements: string
  sample_phrases: string[]
  avoid_words: string[]
  preferred_greetings: string[]
  preferred_closings: string[]
  ai_temperature: number
  ai_max_tokens: number
  ai_model: string
  is_default: boolean
}

const defaultFormData: ToneProfileFormData = {
  name: '',
  description: '',
  formality_level: 'professional',
  communication_style: 'collaborative',
  personality_traits: [],
  industry_language: 'general',
  custom_elements: '',
  sample_phrases: [''],
  avoid_words: [''],
  preferred_greetings: [''],
  preferred_closings: [''],
  ai_temperature: 0.7,
  ai_max_tokens: 1000,
  ai_model: 'gpt-4',
  is_default: false
}

export function useToneProfiles() {
  const [profiles, setProfiles] = useState<ToneProfile[]>([])
  const [templates, setTemplates] = useState<ToneProfileTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Load tone profiles
  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/user/tone-profiles?include_usage=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load tone profiles')
      }

      const data = await response.json()
      if (data.success) {
        setProfiles(data.data || [])
      }
    } catch (error: any) {
      console.error('Error loading tone profiles:', error)
      toast.error('Failed to load tone profiles')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/user/tone-profiles/templates?limit=10')
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.data || [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }, [])

  // Create profile
  const createProfile = useCallback(async (formData: ToneProfileFormData): Promise<boolean> => {
    try {
      setSubmitting(true)
      const token = localStorage.getItem('auth_token')
      const payload = {
        ...formData,
        sample_phrases: formData.sample_phrases.filter(p => p.trim()),
        avoid_words: formData.avoid_words.filter(w => w.trim()),
        preferred_greetings: formData.preferred_greetings.filter(g => g.trim()),
        preferred_closings: formData.preferred_closings.filter(c => c.trim())
      }

      const response = await fetch('/api/user/tone-profiles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create tone profile')
      }

      const data = await response.json()
      if (data.success) {
        setProfiles(prev => [data.data, ...prev])
        toast.success(`Tone profile "${data.data.name}" created successfully`)
        return true
      }
      return false
    } catch (error: any) {
      console.error('Error creating tone profile:', error)
      toast.error(error.message)
      return false
    } finally {
      setSubmitting(false)
    }
  }, [])

  // Update profile
  const updateProfile = useCallback(async (profileId: string, formData: ToneProfileFormData): Promise<boolean> => {
    try {
      setSubmitting(true)
      const token = localStorage.getItem('auth_token')
      const payload = {
        ...formData,
        sample_phrases: formData.sample_phrases.filter(p => p.trim()),
        avoid_words: formData.avoid_words.filter(w => w.trim()),
        preferred_greetings: formData.preferred_greetings.filter(g => g.trim()),
        preferred_closings: formData.preferred_closings.filter(c => c.trim())
      }

      const response = await fetch(`/api/user/tone-profiles/${profileId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update tone profile')
      }

      const data = await response.json()
      if (data.success) {
        setProfiles(prev => prev.map(p => p.id === profileId ? data.data : p))
        toast.success(`Tone profile "${data.data.name}" updated successfully`)
        return true
      }
      return false
    } catch (error: any) {
      console.error('Error updating tone profile:', error)
      toast.error(error.message)
      return false
    } finally {
      setSubmitting(false)
    }
  }, [])

  // Set default profile
  const setDefaultProfile = useCallback(async (profileId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/user/tone-profiles/${profileId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'set_default' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to set default profile')
      }

      // Update local state
      setProfiles(prev => prev.map(p => ({ 
        ...p, 
        is_default: p.id === profileId 
      })))
      
      toast.success('Default tone profile updated')
    } catch (error: any) {
      toast.error(error.message)
    }
  }, [])

  // Duplicate profile
  const duplicateProfile = useCallback(async (profileId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/user/tone-profiles/${profileId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'duplicate' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to duplicate profile')
      }

      const data = await response.json()
      if (data.success) {
        setProfiles(prev => [data.data, ...prev])
        toast.success(`Tone profile duplicated as "${data.data.name}"`)
      }
    } catch (error: any) {
      toast.error(error.message)
    }
  }, [])

  // Delete profile
  const deleteProfile = useCallback(async (profileId: string, profileName: string): Promise<void> => {
    if (!confirm(`Are you sure you want to delete the tone profile "${profileName}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/user/tone-profiles/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete tone profile')
      }

      setProfiles(prev => prev.filter(p => p.id !== profileId))
      toast.success(`Tone profile "${profileName}" deleted`)
    } catch (error: any) {
      toast.error(error.message)
    }
  }, [])

  // Create from template
  const createFromTemplate = useCallback(async (template: ToneProfileTemplate, customName?: string): Promise<void> => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/user/tone-profiles/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: template.id,
          customizations: {
            name: customName || template.name
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create from template')
      }

      const data = await response.json()
      if (data.success) {
        setProfiles(prev => [data.data, ...prev])
        toast.success(`Created tone profile "${data.data.name}" from template`)
      }
    } catch (error: any) {
      toast.error(error.message)
    }
  }, [])

  // Initialize data
  useEffect(() => {
    loadProfiles()
    loadTemplates()
  }, [loadProfiles, loadTemplates])

  return {
    profiles,
    templates,
    loading,
    submitting,
    defaultFormData,
    actions: {
      loadProfiles,
      loadTemplates,
      createProfile,
      updateProfile,
      setDefaultProfile,
      duplicateProfile,
      deleteProfile,
      createFromTemplate
    }
  }
}