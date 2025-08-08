"use client"

import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconTrendingUp } from '@tabler/icons-react'

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

interface ToneProfileTemplatesProps {
  templates: ToneProfileTemplate[]
  onSelectTemplate: (template: ToneProfileTemplate) => void
  isLoading?: boolean
}

export const ToneProfileTemplates = memo(function ToneProfileTemplates({
  templates,
  onSelectTemplate,
  isLoading = false
}: ToneProfileTemplatesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Templates...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-5 bg-muted rounded w-12"></div>
                  ))}
                </div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tone Profile Templates</CardTitle>
        <CardDescription>
          Start with a pre-built template and customize to your needs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No templates available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <div 
                key={template.id} 
                className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow duration-200"
                role="article"
                aria-labelledby={`template-${template.id}-title`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 
                      id={`template-${template.id}-title`}
                      className="font-medium truncate"
                    >
                      {template.name}
                    </h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {template.category}
                    </p>
                  </div>
                  {template.is_premium && (
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                      Premium
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
                
                <div className="flex flex-wrap gap-1">
                  {template.personality_traits.slice(0, 3).map(trait => (
                    <Badge key={trait} variant="outline" className="text-xs">
                      {trait}
                    </Badge>
                  ))}
                  {template.personality_traits.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.personality_traits.length - 3}
                    </Badge>
                  )}
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
                  onClick={() => onSelectTemplate(template)}
                  aria-label={`Use ${template.name} template`}
                >
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
})