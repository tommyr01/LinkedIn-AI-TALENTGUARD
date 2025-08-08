"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  IconVoice,
  IconPlus,
  IconEdit,
  IconTrash,
  IconStar,
  IconStarFilled,
  IconCopy,
  IconSettings,
  IconRefresh,
  IconCheck,
  IconX,
  IconTemplate,
  IconTrendingUp
} from '@tabler/icons-react'
import { toast } from 'sonner'

interface ToneProfile {
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

interface ToneProfileTemplate {
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

export function ToneProfileManager() {
  const [profiles, setProfiles] = useState<ToneProfile[]>([])
  const [templates, setTemplates] = useState<ToneProfileTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState<ToneProfile | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    formality_level: 'professional' as const,
    communication_style: 'collaborative' as const,
    personality_traits: [] as string[],
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
  })

  const personalityTraitOptions = [
    'enthusiastic', 'analytical', 'supportive', 'authoritative', 'empathetic', 'innovative'
  ]

  const industryLanguageOptions = [
    { value: 'hr_tech', label: 'HR Technology' },
    { value: 'leadership_development', label: 'Leadership Development' },
    { value: 'sales', label: 'Sales' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'general', label: 'General Business' }
  ]

  const formalityLevels = [
    { value: 'professional', label: 'Professional', description: 'Formal, business-appropriate tone' },
    { value: 'conversational', label: 'Conversational', description: 'Friendly yet professional' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and approachable' }
  ]

  const communicationStyles = [
    { value: 'direct', label: 'Direct', description: 'Straight-forward and to the point' },
    { value: 'collaborative', label: 'Collaborative', description: 'Partnership-focused approach' },
    { value: 'consultative', label: 'Consultative', description: 'Advisory and questioning style' }
  ]

  useEffect(() => {
    loadToneProfiles()
    loadTemplates()
  }, [])

  const loadToneProfiles = async () => {
    try {
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
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/user/tone-profiles/templates?limit=10')
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.data || [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleCreateProfile = async () => {
    try {
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
        resetForm()
        setShowCreateForm(false)
        toast.success(`Tone profile "${data.data.name}" created successfully`)
      }
    } catch (error: any) {
      console.error('Error creating tone profile:', error)
      toast.error(error.message)
    }
  }

  const handleUpdateProfile = async (profileId: string) => {
    try {
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
        resetForm()
        setEditingProfile(null)
        toast.success(`Tone profile "${data.data.name}" updated successfully`)
      }
    } catch (error: any) {
      console.error('Error updating tone profile:', error)
      toast.error(error.message)
    }
  }

  const handleSetDefault = async (profileId: string) => {
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
  }

  const handleDuplicate = async (profileId: string) => {
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
  }

  const handleDeleteProfile = async (profileId: string, profileName: string) => {
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
  }

  const handleCreateFromTemplate = async (template: ToneProfileTemplate, customName?: string) => {
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
        setShowTemplates(false)
      }
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const resetForm = () => {
    setFormData({
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
    })
  }

  const loadProfileIntoForm = (profile: ToneProfile) => {
    setFormData({
      name: profile.name,
      description: profile.description || '',
      formality_level: profile.formality_level,
      communication_style: profile.communication_style,
      personality_traits: profile.personality_traits,
      industry_language: profile.industry_language,
      custom_elements: profile.custom_elements || '',
      sample_phrases: profile.sample_phrases.length ? profile.sample_phrases : [''],
      avoid_words: profile.avoid_words.length ? profile.avoid_words : [''],
      preferred_greetings: profile.preferred_greetings.length ? profile.preferred_greetings : [''],
      preferred_closings: profile.preferred_closings.length ? profile.preferred_closings : [''],
      ai_temperature: profile.ai_temperature,
      ai_max_tokens: profile.ai_max_tokens,
      ai_model: profile.ai_model,
      is_default: profile.is_default
    })
  }

  const addArrayItem = (field: keyof typeof formData, value: string = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value]
    }))
  }

  const updateArrayItem = (field: keyof typeof formData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }))
  }

  const removeArrayItem = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <IconRefresh className="h-6 w-6 animate-spin mr-2" />
            Loading tone profiles...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <IconVoice className="h-6 w-6" />
            Tone of Voice Settings
          </h2>
          <p className="text-muted-foreground">
            Create and manage tone profiles for AI-generated content
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2"
          >
            <IconTemplate className="h-4 w-4" />
            Templates
          </Button>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <IconPlus className="h-4 w-4" />
            Create Profile
          </Button>
        </div>
      </div>

      {/* Templates Section */}
      {showTemplates && (
        <Card>
          <CardHeader>
            <CardTitle>Tone Profile Templates</CardTitle>
            <CardDescription>
              Start with a pre-built template and customize to your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <div key={template.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {template.category}
                      </p>
                    </div>
                    {template.is_premium && (
                      <Badge variant="secondary">Premium</Badge>
                    )}
                  </div>
                  <p className="text-sm">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.personality_traits.slice(0, 3).map(trait => (
                      <Badge key={trait} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{template.usage_count} uses</span>
                    <span className="flex items-center gap-1">
                      <IconTrendingUp className="h-3 w-3" />
                      {Math.round(template.popularity_score)}%
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {profiles.map(profile => (
          <Card key={profile.id} className={profile.is_default ? 'border-primary' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <CardTitle className="text-lg">{profile.name}</CardTitle>
                  {profile.is_default && (
                    <IconStarFilled className="h-4 w-4 text-primary mt-1" />
                  )}
                </div>
                <div className="flex gap-1">
                  {!profile.is_default && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleSetDefault(profile.id)}
                      title="Set as default"
                    >
                      <IconStar className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDuplicate(profile.id)}
                    title="Duplicate"
                  >
                    <IconCopy className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      setEditingProfile(profile)
                      loadProfileIntoForm(profile)
                    }}
                    title="Edit"
                  >
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDeleteProfile(profile.id, profile.name)}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {profile.description && (
                <CardDescription>{profile.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Formality:</span>
                  <p className="capitalize">{profile.formality_level}</p>
                </div>
                <div>
                  <span className="font-medium">Style:</span>
                  <p className="capitalize">{profile.communication_style}</p>
                </div>
                <div>
                  <span className="font-medium">Industry:</span>
                  <p className="capitalize">{profile.industry_language.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="font-medium">Uses:</span>
                  <p>{profile.usage_count}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {profile.personality_traits.map(trait => (
                  <Badge key={trait} variant="secondary" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>

              {profile.effectiveness_score > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Effectiveness: </span>
                  <span className={`${profile.effectiveness_score > 80 ? 'text-green-600' : 
                    profile.effectiveness_score > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {Math.round(profile.effectiveness_score)}%
                  </span>
                </div>
              )}

              {profile.last_used_at && (
                <div className="text-xs text-muted-foreground">
                  Last used: {new Date(profile.last_used_at).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {profiles.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <IconVoice className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">No Tone Profiles Yet</CardTitle>
            <CardDescription className="mb-4">
              Create your first tone profile to get started with AI-generated content that matches your communication style.
            </CardDescription>
            <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
              <IconPlus className="h-4 w-4" />
              Create Your First Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form Modal - This would need to be implemented as a dialog/modal */}
      {(showCreateForm || editingProfile) && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>
              {editingProfile ? 'Edit Tone Profile' : 'Create New Tone Profile'}
            </CardTitle>
            <CardDescription>
              Define how AI should communicate on your behalf
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Profile Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Professional Executive"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry_language">Industry Language</Label>
                <Select 
                  value={formData.industry_language} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, industry_language: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {industryLanguageOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of when to use this tone profile..."
                rows={2}
              />
            </div>

            {/* Communication Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Formality Level</Label>
                <Select 
                  value={formData.formality_level} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, formality_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formalityLevels.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs text-muted-foreground">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Communication Style</Label>
                <Select 
                  value={formData.communication_style} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, communication_style: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {communicationStyles.map(style => (
                      <SelectItem key={style.value} value={style.value}>
                        <div>
                          <div className="font-medium">{style.label}</div>
                          <div className="text-xs text-muted-foreground">{style.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Personality Traits */}
            <div className="space-y-3">
              <Label>Personality Traits</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {personalityTraitOptions.map(trait => (
                  <div key={trait} className="flex items-center space-x-2">
                    <Checkbox
                      id={trait}
                      checked={formData.personality_traits.includes(trait)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            personality_traits: [...prev.personality_traits, trait]
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            personality_traits: prev.personality_traits.filter(t => t !== trait)
                          }))
                        }
                      }}
                    />
                    <Label htmlFor={trait} className="text-sm capitalize">
                      {trait}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Elements */}
            <div className="space-y-2">
              <Label htmlFor="custom_elements">Custom Instructions</Label>
              <Textarea
                id="custom_elements"
                value={formData.custom_elements}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_elements: e.target.value }))}
                placeholder="Additional instructions for AI behavior..."
                rows={3}
              />
            </div>

            {/* AI Settings */}
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <IconSettings className="h-4 w-4" />
                AI Generation Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ai_temperature">Creativity ({formData.ai_temperature})</Label>
                  <input
                    id="ai_temperature"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.ai_temperature}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      ai_temperature: parseFloat(e.target.value) 
                    }))}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">
                    Lower = more focused, Higher = more creative
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai_max_tokens">Max Length</Label>
                  <Input
                    id="ai_max_tokens"
                    type="number"
                    min="50"
                    max="4000"
                    value={formData.ai_max_tokens}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      ai_max_tokens: parseInt(e.target.value) || 1000
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai_model">AI Model</Label>
                  <Select 
                    value={formData.ai_model} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, ai_model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Default Profile Setting */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  is_default: !!checked 
                }))}
              />
              <Label htmlFor="is_default">Set as default tone profile</Label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingProfile(null)
                  resetForm()
                }}
              >
                <IconX className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (editingProfile) {
                    handleUpdateProfile(editingProfile.id)
                  } else {
                    handleCreateProfile()
                  }
                }}
                disabled={!formData.name.trim()}
              >
                <IconCheck className="h-4 w-4 mr-2" />
                {editingProfile ? 'Update Profile' : 'Create Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}