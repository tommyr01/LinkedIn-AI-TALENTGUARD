'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus, Settings, TrendingUp, Download } from 'lucide-react'
import { toast } from "sonner"
import { ConnectionPostsTable, type ConnectionPost, type PostStats } from '@/components/connection-posts-table'

export default function MyPostsPage() {
  const [posts, setPosts] = useState<ConnectionPost[]>([])
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

  // Fetch TalentGuard posts from database
  const fetchPosts = async () => {
    setIsLoading(true)
    try {
      console.log('🔍 Loading TalentGuard posts from database...')
      
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
        
        console.log(`✅ Loaded ${data.posts.length} posts from database`)
        toast.success(`Loaded ${data.posts.length} posts${data.meta.lastSync ? ` (Last sync: ${new Date(data.meta.lastSync).toLocaleString()})` : ' (No recent sync - click "Refresh from LinkedIn" to get latest)'}`)
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


  // Refresh posts data - this will sync TalentGuard posts from LinkedIn
  const refreshPosts = async () => {
    setIsLoading(true)
    try {
      console.log('🔄 Refreshing TalentGuard posts from LinkedIn...')
      toast.info('Fetching latest posts from LinkedIn...')
      
      // Call the sync API to fetch TalentGuard posts from RapidAPI
      const syncResponse = await fetch('/api/linkedin/posts/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          companyName: 'talentguard',
          maxPages: 1 // Fetch only page 1
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
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My LinkedIn Posts</h2>
          <p className="text-muted-foreground">
            View and analyze your LinkedIn posts with automatic prospect identification
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={refreshPosts}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Fetching Posts...' : 'Refresh from LinkedIn'}
          </Button>
          <Button variant="outline" onClick={() => window.open('/dashboard/content', '_self')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Content
          </Button>
        </div>
      </div>

      {/* Posts Table with built-in stats */}
      <ConnectionPostsTable
        posts={posts}
        stats={stats}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        showCommentGeneration={false}
      />
    </div>
  )
}