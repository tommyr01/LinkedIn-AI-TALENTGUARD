"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Plus, TrendingUp, Users, MessageSquare, Eye, BarChart3, Target } from 'lucide-react'
import { toast } from "sonner"
import { LinkedInPostsTable } from '@/components/linkedin-posts-table'
import { LinkedInProspectsPanel } from '@/components/linkedin-prospects-panel'
import { LinkedInStatsCards } from '@/components/linkedin-stats-cards'

// Types matching our API response
interface LinkedInPost {
  id: string
  connectionName: string
  connectionCompany?: string
  content: string
  postedAt: string
  postUrn: string
  postUrl?: string
  likesCount: number
  commentsCount: number
  totalReactions: number
  reposts: number
  authorFirstName: string
  authorLastName: string
  authorHeadline?: string
  authorLinkedInUrl?: string
  authorProfilePicture?: string
  postType: string
  mediaType?: string
  mediaUrl?: string
  mediaThumbnail?: string
  createdTime: string
  hasMedia?: boolean
  documentTitle?: string
  documentPageCount?: number
  support?: number
  love?: number
  insight?: number
  celebrate?: number
  lastSyncedAt?: string
}

interface PostStats {
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalReactions: number
  uniqueConnections: number
  averageEngagement: number
  totalReposts: number
  totalSupport: number
  totalLove: number
  totalInsight: number
  totalCelebrate: number
  postsWithMedia: number
  documentsShared: number
}

export default function LinkedInMyPostsPage() {
  const [posts, setPosts] = useState<LinkedInPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<PostStats>({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalReactions: 0,
    uniqueConnections: 0,
    averageEngagement: 0,
    totalReposts: 0,
    totalSupport: 0,
    totalLove: 0,
    totalInsight: 0,
    totalCelebrate: 0,
    postsWithMedia: 0,
    documentsShared: 0
  })
  const [showProspects, setShowProspects] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  // Fetch LinkedIn posts from TalentGuard database
  const fetchPosts = async () => {
    setIsLoading(true)
    try {
      console.log('🔍 Loading LinkedIn posts from TalentGuard database...')
      
      const response = await fetch('/api/linkedin/posts/list?maxRecords=100&sortField=posted_at&sortDirection=desc', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setPosts(data.posts)
        setStats(data.stats)
        setLastSync(data.meta.lastSync)
        
        console.log(`✅ Loaded ${data.posts.length} LinkedIn posts from TalentGuard database`)
        toast.success(`Loaded ${data.posts.length} LinkedIn posts${data.meta.lastSync ? ` (Last sync: ${new Date(data.meta.lastSync).toLocaleString()})` : ''}`)
      } else {
        throw new Error(data.error || 'Failed to fetch posts')
      }

    } catch (error: any) {
      console.error('Error fetching LinkedIn posts:', error)
      toast.error(`Failed to load posts: ${error.message}`)
      
      // Set empty state on error
      setPosts([])
      setStats({
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        totalReactions: 0,
        uniqueConnections: 0,
        averageEngagement: 0,
        totalReposts: 0,
        totalSupport: 0,
        totalLove: 0,
        totalInsight: 0,
        totalCelebrate: 0,
        postsWithMedia: 0,
        documentsShared: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh posts data - this will sync LinkedIn posts from RapidAPI
  const refreshPosts = async () => {
    setIsLoading(true)
    try {
      console.log('🔄 Refreshing LinkedIn posts from LinkedIn API...')
      toast.info('Fetching latest posts from LinkedIn...')
      
      // Call the sync API to fetch posts from RapidAPI
      const syncResponse = await fetch('/api/linkedin/posts/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          maxPages: 2 // Fetch 2 pages max for TalentGuard
        })
      })

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Sync failed: HTTP ${syncResponse.status}`)
      }

      const syncData = await syncResponse.json()
      
      if (syncData.success) {
        const summary = syncData.data.summary
        toast.success(`Sync completed! ${summary.newPosts} new posts, ${summary.updatedPosts} updated posts`)
        
        // Now fetch the updated data from Supabase
        await fetchPosts()
      } else {
        throw new Error(syncData.error || 'Sync operation failed')
      }

    } catch (error: any) {
      console.error('Error refreshing posts from LinkedIn:', error)
      toast.error(`Failed to refresh posts: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Load posts on component mount
  useEffect(() => {
    fetchPosts()
  }, [])

  const handleRefresh = () => {
    refreshPosts()
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">LinkedIn Content Intelligence</h2>
          <p className="text-muted-foreground">
            Track your LinkedIn posts performance and identify high-value prospects engaging with your content
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowProspects(!showProspects)}
            className="gap-2"
          >
            <Target className="h-4 w-4" />
            {showProspects ? 'Hide Prospects' : 'Show Prospects'}
          </Button>
          <Button 
            variant="outline" 
            onClick={refreshPosts}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Sync from LinkedIn'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open('/dashboard/content', '_self')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Content
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <LinkedInStatsCards stats={stats} lastSync={lastSync} />

      {/* Quick Insights */}
      {posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top Performing Post
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.max(...posts.map(p => p.totalReactions))} reactions
              </div>
              <p className="text-xs text-muted-foreground">
                {posts.find(p => p.totalReactions === Math.max(...posts.map(p => p.totalReactions)))?.content.substring(0, 50)}...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Engagement Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((stats.totalReactions / Math.max(stats.totalPosts, 1)) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average per post
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Content with Media
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.postsWithMedia}
              </div>
              <p className="text-xs text-muted-foreground">
                {((stats.postsWithMedia / Math.max(stats.totalPosts, 1)) * 100).toFixed(0)}% of posts
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6" style={{ gridTemplateColumns: showProspects ? '2fr 1fr' : '1fr' }}>
        {/* Posts Table */}
        <div>
          <LinkedInPostsTable
            posts={posts}
            stats={stats}
            onRefresh={handleRefresh}
            isLoading={isLoading}
          />
        </div>

        {/* Prospects Panel */}
        {showProspects && (
          <div>
            <LinkedInProspectsPanel />
          </div>
        )}
      </div>
    </div>
  )
}