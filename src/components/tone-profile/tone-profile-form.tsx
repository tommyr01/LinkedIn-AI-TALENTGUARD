"use client"

import { memo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { IconCheck, IconX, IconSettings } from '@tabler/icons-react'

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

interface ToneProfileFormProps {
  formData: ToneProfileFormData
  onFormDataChange: (data: Partial<ToneProfileFormData>) => void
  onSubmit: () => void
  onCancel: () => void
  isEditMode: boolean
  isSubmitting?: boolean
}

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

export const ToneProfileForm = memo(function ToneProfileForm({
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  isEditMode,
  isSubmitting = false
}: ToneProfileFormProps) {
  const handleFieldChange = useCallback((field: keyof ToneProfileFormData, value: any) => {
    onFormDataChange({ [field]: value })
  }, [onFormDataChange])

  const handlePersonalityTraitToggle = useCallback((trait: string, checked: boolean) => {
    const newTraits = checked
      ? [...formData.personality_traits, trait]
      : formData.personality_traits.filter(t => t !== trait)
    
    handleFieldChange('personality_traits', newTraits)
  }, [formData.personality_traits, handleFieldChange])

  const isFormValid = formData.name.trim().length > 0

  return (
    <Card className="border-primary" role="dialog" aria-labelledby="form-title">
      <CardHeader>
        <CardTitle id="form-title">
          {isEditMode ? 'Edit Tone Profile' : 'Create New Tone Profile'}
        </CardTitle>
        <CardDescription>
          Define how AI should communicate on your behalf
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="required">Profile Name</Label>
            <Input
              id="profile-name"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="e.g., Professional Executive"
              aria-required="true"
              aria-invalid={!formData.name.trim()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry-language">Industry Language</Label>
            <Select 
              value={formData.industry_language} 
              onValueChange={(value) => handleFieldChange('industry_language', value)}
            >
              <SelectTrigger id="industry-language">
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
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Brief description of when to use this tone profile..."
            rows={2}
          />
        </div>

        {/* Communication Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="formality-level">Formality Level</Label>
            <Select 
              value={formData.formality_level} 
              onValueChange={(value: any) => handleFieldChange('formality_level', value)}
            >
              <SelectTrigger id="formality-level">
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
            <Label htmlFor="communication-style">Communication Style</Label>
            <Select 
              value={formData.communication_style} 
              onValueChange={(value: any) => handleFieldChange('communication_style', value)}
            >
              <SelectTrigger id="communication-style">
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2" role="group" aria-labelledby="personality-traits-label">
            {personalityTraitOptions.map(trait => (
              <div key={trait} className="flex items-center space-x-2">
                <Checkbox
                  id={`trait-${trait}`}
                  checked={formData.personality_traits.includes(trait)}
                  onCheckedChange={(checked) => handlePersonalityTraitToggle(trait, !!checked)}
                />
                <Label htmlFor={`trait-${trait}`} className="text-sm capitalize">
                  {trait}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="space-y-2">
          <Label htmlFor="custom-instructions">Custom Instructions</Label>
          <Textarea
            id="custom-instructions"
            value={formData.custom_elements}
            onChange={(e) => handleFieldChange('custom_elements', e.target.value)}
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
              <Label htmlFor="ai-creativity">Creativity ({formData.ai_temperature})</Label>
              <input
                id="ai-creativity"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={formData.ai_temperature}
                onChange={(e) => handleFieldChange('ai_temperature', parseFloat(e.target.value))}
                className="w-full accent-primary"
                aria-label={`Creativity level: ${formData.ai_temperature}`}
              />
              <div className="text-xs text-muted-foreground">
                Lower = more focused, Higher = more creative
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-max-tokens">Max Length</Label>
              <Input
                id="ai-max-tokens"
                type="number"
                min="50"
                max="4000"
                value={formData.ai_max_tokens}
                onChange={(e) => handleFieldChange('ai_max_tokens', parseInt(e.target.value) || 1000)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-model">AI Model</Label>
              <Select 
                value={formData.ai_model} 
                onValueChange={(value) => handleFieldChange('ai_model', value)}
              >
                <SelectTrigger id="ai-model">
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
            id="is-default"
            checked={formData.is_default}
            onCheckedChange={(checked) => handleFieldChange('is_default', !!checked)}
          />
          <Label htmlFor="is-default">Set as default tone profile</Label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <IconX className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={onSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            <IconCheck className="h-4 w-4 mr-2" />
            {isSubmitting 
              ? 'Saving...' 
              : isEditMode ? 'Update Profile' : 'Create Profile'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})