"use client"

import { memo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { IconCheck, IconX, IconSettings } from '@tabler/icons-react'

export interface ToneProfileFormData {
  name: string
  description: string
  context_guidelines: string
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
        <div className="space-y-4">
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
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Brief description of when to use this tone profile..."
              rows={2}
            />
          </div>

          {/* Context Guidelines */}
          <div className="space-y-2">
            <Label htmlFor="context-guidelines">Context Guidelines</Label>
            <Textarea
              id="context-guidelines"
              value={formData.context_guidelines}
              onChange={(e) => handleFieldChange('context_guidelines', e.target.value)}
              placeholder="Enter your tone of voice guidelines here. For example: Use a professional yet approachable tone. Focus on collaboration and partnership. Emphasize data-driven insights while maintaining warmth..."
              rows={8}
              className="min-h-[200px]"
            />
            <div className="text-xs text-muted-foreground">
              Provide detailed guidelines for how AI should communicate on your behalf, including tone, style, personality traits, and any specific language preferences.
            </div>
          </div>
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
              <Input
                id="ai-model"
                type="text"
                value={formData.ai_model}
                onChange={(e) => handleFieldChange('ai_model', e.target.value)}
                placeholder="e.g., gpt-4"
              />
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