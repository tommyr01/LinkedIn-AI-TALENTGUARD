"use client"

import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  IconStar,
  IconStarFilled,
  IconCopy,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react'

interface ToneProfile {
  id: string
  name: string
  description?: string
  formality_level: 'professional' | 'conversational' | 'casual'
  communication_style: 'direct' | 'collaborative' | 'consultative'
  personality_traits: string[]
  industry_language: string
  usage_count: number
  effectiveness_score: number
  last_used_at?: string
  is_active: boolean
  is_default: boolean
}

interface ToneProfileCardProps {
  profile: ToneProfile
  onSetDefault: (id: string) => void
  onDuplicate: (id: string) => void
  onEdit: (profile: ToneProfile) => void
  onDelete: (id: string, name: string) => void
}

export const ToneProfileCard = memo(function ToneProfileCard({
  profile,
  onSetDefault,
  onDuplicate,
  onEdit,
  onDelete
}: ToneProfileCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getEffectivenessColor = (score: number) => {
    if (score > 80) return 'text-green-600'
    if (score > 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-lg ${
        profile.is_default ? 'border-primary shadow-sm' : ''
      }`}
      role="article"
      aria-labelledby={`profile-${profile.id}-title`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <CardTitle 
              id={`profile-${profile.id}-title`}
              className="text-lg truncate"
            >
              {profile.name}
            </CardTitle>
            {profile.is_default && (
              <IconStarFilled 
                className="h-4 w-4 text-primary mt-1 flex-shrink-0" 
                aria-label="Default profile"
              />
            )}
          </div>
          <div className="flex gap-1" role="toolbar" aria-label="Profile actions">
            {!profile.is_default && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onSetDefault(profile.id)}
                aria-label="Set as default profile"
              >
                <IconStar className="h-4 w-4" />
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onDuplicate(profile.id)}
              aria-label="Duplicate profile"
            >
              <IconCopy className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onEdit(profile)}
              aria-label="Edit profile"
            >
              <IconEdit className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onDelete(profile.id, profile.name)}
              aria-label="Delete profile"
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
            <span className="font-medium text-muted-foreground">Formality:</span>
            <p className="capitalize">{profile.formality_level}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Style:</span>
            <p className="capitalize">{profile.communication_style}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Industry:</span>
            <p className="capitalize">{profile.industry_language.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Uses:</span>
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
            <span className={getEffectivenessColor(profile.effectiveness_score)}>
              {Math.round(profile.effectiveness_score)}%
            </span>
          </div>
        )}

        {profile.last_used_at && (
          <div className="text-xs text-muted-foreground">
            Last used: {formatDate(profile.last_used_at)}
          </div>
        )}
      </CardContent>
    </Card>
  )
})