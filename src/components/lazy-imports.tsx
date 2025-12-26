import dynamic from 'next/dynamic'
import { LoadingSpinner, CardLoadingSkeleton } from './loading-states'

// Lazy load heavy components with loading fallbacks
export const LazyToneProfileManager = dynamic(
  () => import('./tone-profile/tone-profile-manager-v2').then(mod => ({ default: mod.ToneProfileManagerV2 })),
  {
    loading: () => <CardLoadingSkeleton rows={5} />,
    ssr: false
  }
)

export const LazyOptimizedLinkedInPostsTable = dynamic(
  () => import('./linkedin-posts/optimized-posts-table').then(mod => ({ default: mod.OptimizedLinkedInPostsTable })),
  {
    loading: () => <CardLoadingSkeleton rows={8} />,
    ssr: false
  }
)

export const LazyIntelligenceCard = dynamic(
  () => import('./intelligence/intelligence-card').then(mod => ({ default: mod.IntelligenceCard })),
  {
    loading: () => <CardLoadingSkeleton />,
    ssr: false
  }
)

export const LazyCompanySearch = dynamic(
  () => import('./company-search').then(mod => ({ default: mod.CompanySearch })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    ),
    ssr: false
  }
)

export const LazyProspectResearchCard = dynamic(
  () => import('./prospect-research-card').then(mod => ({ default: mod.ProspectResearchCard })),
  {
    loading: () => <CardLoadingSkeleton />,
    ssr: false
  }
)

// Charts and heavy visualizations
export const LazyLinkedInStatsCards = dynamic(
  () => import('./linkedin-stats-cards').then(mod => ({ default: mod.LinkedInStatsCards })),
  {
    loading: () => (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardLoadingSkeleton key={i} showHeader={false} rows={2} />
        ))}
      </div>
    ),
    ssr: false
  }
)

// Error boundary wrapper for lazy components
export const LazyComponentWrapper = ({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) => {
  return (
    <div className="lazy-component-wrapper">
      {children}
    </div>
  )
}