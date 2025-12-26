"use client"

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { IconRefresh } from '@tabler/icons-react'

// Generic loading spinner
export function LoadingSpinner({ size = 'md', className = '' }: { 
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }

  return (
    <IconRefresh 
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      aria-label="Loading"
    />
  )
}

// Full page loading
export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

// Card loading skeleton
export function CardLoadingSkeleton({ 
  showHeader = true,
  rows = 3,
  className = ''
}: {
  showHeader?: boolean
  rows?: number
  className?: string
}) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Table loading skeleton
export function TableLoadingSkeleton({ 
  columns = 4, 
  rows = 5,
  showHeader = true 
}: {
  columns?: number
  rows?: number
  showHeader?: boolean
}) {
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={rowIndex} 
            className="grid gap-4" 
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Grid loading skeleton (for card grids)
export function GridLoadingSkeleton({ 
  items = 6,
  columns = 3,
  className = '' 
}: {
  items?: number
  columns?: number
  className?: string
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  }

  return (
    <div className={`grid gap-6 ${gridCols[columns as keyof typeof gridCols] || gridCols[3]} ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <CardLoadingSkeleton key={i} />
      ))}
    </div>
  )
}

// Inline loading for buttons
export function InlineLoading({ 
  text = 'Loading...',
  size = 'sm',
  className = ''
}: {
  text?: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LoadingSpinner size={size} />
      <span className="text-sm">{text}</span>
    </div>
  )
}

// List loading skeleton
export function ListLoadingSkeleton({ 
  items = 5,
  showAvatar = false,
  className = ''
}: {
  items?: number
  showAvatar?: boolean
  className?: string
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          {showAvatar && (
            <Skeleton className="h-10 w-10 rounded-full" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Form loading skeleton
export function FormLoadingSkeleton({
  fields = 5,
  columns = 1,
  showSubmit = true,
  className = ''
}: {
  fields?: number
  columns?: number
  showSubmit?: boolean
  className?: string
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className={`grid gap-4 ${gridCols[columns as keyof typeof gridCols] || gridCols[1]}`}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      
      {showSubmit && (
        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  )
}

// Empty state component
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}