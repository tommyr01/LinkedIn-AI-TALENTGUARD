"use client"

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconVoice, IconPlus, IconTemplate, IconRefresh } from '@tabler/icons-react'

import { ToneProfileCard } from './tone-profile-card'
import { ToneProfileForm, type ToneProfileFormData } from './tone-profile-form'
import { ToneProfileTemplates } from './tone-profile-templates'
import { useToneProfiles, type ToneProfile } from '@/hooks/use-tone-profiles'

export function ToneProfileManagerV2() {
  const {
    profiles,
    templates,
    loading,
    submitting,
    defaultFormData,
    actions
  } = useToneProfiles()

  const [editingProfile, setEditingProfile] = useState<ToneProfile | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [formData, setFormData] = useState<ToneProfileFormData>(defaultFormData)

  // Form handlers
  const handleFormDataChange = useCallback((updates: Partial<ToneProfileFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const handleCreateProfile = useCallback(async () => {
    const success = await actions.createProfile(formData)
    if (success) {
      setFormData(defaultFormData)
      setShowCreateForm(false)
    }
  }, [formData, actions, defaultFormData])

  const handleUpdateProfile = useCallback(async () => {
    if (!editingProfile) return
    
    const success = await actions.updateProfile(editingProfile.id, formData)
    if (success) {
      setFormData(defaultFormData)
      setEditingProfile(null)
    }
  }, [editingProfile, formData, actions, defaultFormData])

  const handleEditProfile = useCallback((profile: ToneProfile) => {
    setEditingProfile(profile)
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
  }, [])

  const handleCancelEdit = useCallback(() => {
    setShowCreateForm(false)
    setEditingProfile(null)
    setFormData(defaultFormData)
  }, [defaultFormData])

  const handleCreateFromTemplate = useCallback((template: any) => {
    actions.createFromTemplate(template)
    setShowTemplates(false)
  }, [actions])

  // Loading state
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <span className="hidden sm:inline">Templates</span>
          </Button>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <IconPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Profile</span>
          </Button>
        </div>
      </div>

      {/* Templates Section */}
      {showTemplates && (
        <ToneProfileTemplates
          templates={templates}
          onSelectTemplate={handleCreateFromTemplate}
        />
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingProfile) && (
        <ToneProfileForm
          formData={formData}
          onFormDataChange={handleFormDataChange}
          onSubmit={editingProfile ? handleUpdateProfile : handleCreateProfile}
          onCancel={handleCancelEdit}
          isEditMode={!!editingProfile}
          isSubmitting={submitting}
        />
      )}

      {/* Existing Profiles */}
      {profiles.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {profiles.map(profile => (
            <ToneProfileCard
              key={profile.id}
              profile={profile}
              onSetDefault={actions.setDefaultProfile}
              onDuplicate={actions.duplicateProfile}
              onEdit={handleEditProfile}
              onDelete={actions.deleteProfile}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <IconVoice className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tone Profiles Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first tone profile to get started with AI-generated content that matches your communication style.
            </p>
            <Button 
              onClick={() => setShowCreateForm(true)} 
              className="flex items-center gap-2"
            >
              <IconPlus className="h-4 w-4" />
              Create Your First Profile
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}