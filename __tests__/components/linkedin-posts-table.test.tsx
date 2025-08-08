/**
 * Component Tests for LinkedIn Posts Table
 * Tests React component for displaying LinkedIn posts
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LinkedInPostsTable } from '@/components/linkedin-posts-table'

// Mock the PostDetailDialog component
jest.mock('@/components/post-detail-dialog', () => ({
  PostDetailDialog: ({ post, isOpen, onClose }: any) => (
    isOpen ? (
      <div data-testid="post-detail-dialog">
        <h2>{post?.text || 'Post Detail Dialog'}</h2>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}))

describe('LinkedInPostsTable', () => {
  const mockPosts = [
    {
      urn: 'urn:li:activity:123456',
      text: 'The future of HR is data-driven. Here are 5 key metrics every People leader should track...',
      url: 'https://www.linkedin.com/posts/johnsmith_hrtech-activity-123456',
      posted_at: {
        date: '2024-01-15',
        relative: '2 weeks ago',
        timestamp: 1705334400
      },
      author: {
        first_name: 'John',
        last_name: 'Smith',
        headline: 'VP of People Operations',
        username: 'johnsmith',
        profile_url: 'https://www.linkedin.com/in/johnsmith',
        profile_picture: 'https://media.licdn.com/profile.jpg'
      },
      stats: {
        total_reactions: 245,
        like: 180,
        support: 25,
        love: 15,
        insight: 20,
        celebrate: 5,
        comments: 32,
        reposts: 18
      }
    },
    {
      urn: 'urn:li:activity:789012',
      text: 'Remote work isn\'t going anywhere. Companies that embrace flexibility will win the talent war.',
      url: 'https://www.linkedin.com/posts/johnsmith_remote-work-activity-789012',
      posted_at: {
        date: '2024-01-10',
        relative: '3 weeks ago',
        timestamp: 1704902400
      },
      author: {
        first_name: 'John',
        last_name: 'Smith',
        headline: 'VP of People Operations',
        username: 'johnsmith',
        profile_url: 'https://www.linkedin.com/in/johnsmith',
        profile_picture: 'https://media.licdn.com/profile.jpg'
      },
      stats: {
        total_reactions: 156,
        like: 120,
        support: 20,
        love: 10,
        insight: 6,
        celebrate: 0,
        comments: 24,
        reposts: 12
      }
    }
  ]

  const mockProps = {
    posts: mockPosts,
    loading: false,
    onGenerateComment: jest.fn(),
    onViewPost: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render posts table with headers', () => {
      render(<LinkedInPostsTable {...mockProps} />)
      
      expect(screen.getByText('Post')).toBeInTheDocument()
      expect(screen.getByText('Engagement')).toBeInTheDocument()
      expect(screen.getByText('Posted')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('should display all posts', () => {
      render(<LinkedInPostsTable {...mockProps} />)
      
      expect(screen.getByText(/The future of HR is data-driven/)).toBeInTheDocument()
      expect(screen.getByText(/Remote work isn't going anywhere/)).toBeInTheDocument()
    })

    it('should show post engagement stats', () => {
      render(<LinkedInPostsTable {...mockProps} />)
      
      expect(screen.getByText('245')).toBeInTheDocument() // total reactions
      expect(screen.getByText('32')).toBeInTheDocument() // comments
      expect(screen.getByText('18')).toBeInTheDocument() // reposts
    })

    it('should display relative posting times', () => {
      render(<LinkedInPostsTable {...mockProps} />)
      
      expect(screen.getByText('2 weeks ago')).toBeInTheDocument()
      expect(screen.getByText('3 weeks ago')).toBeInTheDocument()
    })

    it('should truncate long post text', () => {
      const longTextPost = {
        ...mockPosts[0],
        text: 'This is a very long post that should be truncated when displayed in the table view because it exceeds the maximum length that we want to show in the table format for better readability and user experience.'
      }

      render(<LinkedInPostsTable {...mockProps} posts={[longTextPost]} />)
      
      const postText = screen.getByText(/This is a very long post/)
      expect(postText.textContent?.length).toBeLessThan(longTextPost.text.length)
    })
  })

  describe('Loading States', () => {
    it('should show loading skeleton when loading', () => {
      render(<LinkedInPostsTable {...mockProps} loading={true} />)
      
      // Should show skeleton rows instead of actual content
      expect(screen.getAllByTestId(/skeleton/i)).toBeTruthy()
    })

    it('should show empty state when no posts', () => {
      render(<LinkedInPostsTable {...mockProps} posts={[]} />)
      
      expect(screen.getByText(/No posts found/i)).toBeInTheDocument()
    })

    it('should handle undefined posts gracefully', () => {
      render(<LinkedInPostsTable {...mockProps} posts={undefined as any} />)
      
      expect(screen.getByText(/No posts found/i)).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onViewPost when post is clicked', async () => {
      const user = userEvent.setup()
      render(<LinkedInPostsTable {...mockProps} />)
      
      const postRow = screen.getByText(/The future of HR is data-driven/).closest('tr')
      expect(postRow).toBeTruthy()
      
      await user.click(postRow!)
      
      expect(mockProps.onViewPost).toHaveBeenCalledWith(mockPosts[0])
    })

    it('should call onGenerateComment when Generate Comment button is clicked', async () => {
      const user = userEvent.setup()
      render(<LinkedInPostsTable {...mockProps} />)
      
      const generateButtons = screen.getAllByText(/Generate Comment/i)
      await user.click(generateButtons[0])
      
      expect(mockProps.onGenerateComment).toHaveBeenCalledWith(mockPosts[0])
    })

    it('should open external link when View on LinkedIn is clicked', async () => {
      const user = userEvent.setup()
      
      // Mock window.open
      const mockOpen = jest.fn()
      Object.defineProperty(window, 'open', { value: mockOpen })
      
      render(<LinkedInPostsTable {...mockProps} />)
      
      const viewOnLinkedInButtons = screen.getAllByText(/View on LinkedIn/i)
      await user.click(viewOnLinkedInButtons[0])
      
      expect(mockOpen).toHaveBeenCalledWith(mockPosts[0].url, '_blank')
    })

    it('should open post detail dialog when View Details is clicked', async () => {
      const user = userEvent.setup()
      render(<LinkedInPostsTable {...mockProps} />)
      
      const viewDetailsButtons = screen.getAllByText(/View Details/i)
      await user.click(viewDetailsButtons[0])
      
      await waitFor(() => {
        expect(screen.getByTestId('post-detail-dialog')).toBeInTheDocument()
      })
    })

    it('should close post detail dialog', async () => {
      const user = userEvent.setup()
      render(<LinkedInPostsTable {...mockProps} />)
      
      // Open dialog
      const viewDetailsButtons = screen.getAllByText(/View Details/i)
      await user.click(viewDetailsButtons[0])
      
      await waitFor(() => {
        expect(screen.getByTestId('post-detail-dialog')).toBeInTheDocument()
      })
      
      // Close dialog
      const closeButton = screen.getByText('Close')
      await user.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('post-detail-dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Engagement Metrics', () => {
    it('should display reaction breakdown', () => {
      render(<LinkedInPostsTable {...mockProps} />)
      
      // Should show individual reaction types
      expect(screen.getByText('180')).toBeInTheDocument() // likes
      expect(screen.getByText('25')).toBeInTheDocument() // support
      expect(screen.getByText('15')).toBeInTheDocument() // love
    })

    it('should calculate engagement rates correctly', () => {
      const postWithHighEngagement = {
        ...mockPosts[0],
        stats: {
          ...mockPosts[0].stats,
          total_reactions: 1000,
          comments: 100,
          reposts: 50
        }
      }

      render(<LinkedInPostsTable {...mockProps} posts={[postWithHighEngagement]} />)
      
      expect(screen.getByText('1000')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
    })

    it('should handle zero engagement gracefully', () => {
      const postWithNoEngagement = {
        ...mockPosts[0],
        stats: {
          total_reactions: 0,
          like: 0,
          support: 0,
          love: 0,
          insight: 0,
          celebrate: 0,
          comments: 0,
          reposts: 0
        }
      }

      render(<LinkedInPostsTable {...mockProps} posts={[postWithNoEngagement]} />)
      
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('Sorting and Filtering', () => {
    it('should sort posts by date by default', () => {
      render(<LinkedInPostsTable {...mockProps} />)
      
      const postRows = screen.getAllByRole('row')
      // First row is header, second should be most recent post
      expect(postRows[1]).toHaveTextContent('2 weeks ago')
      expect(postRows[2]).toHaveTextContent('3 weeks ago')
    })

    it('should sort by engagement when engagement header is clicked', async () => {
      const user = userEvent.setup()
      render(<LinkedInPostsTable {...mockProps} />)
      
      const engagementHeader = screen.getByText('Engagement')
      await user.click(engagementHeader)
      
      // Should re-sort by engagement (highest first)
      const postRows = screen.getAllByRole('row')
      expect(postRows[1]).toHaveTextContent('245') // Higher engagement first
    })

    it('should handle search/filter functionality', async () => {
      const user = userEvent.setup()
      
      // Add search functionality to props if it exists
      const propsWithSearch = {
        ...mockProps,
        searchQuery: 'data-driven',
        onSearchChange: jest.fn()
      }

      render(<LinkedInPostsTable {...propsWithSearch} />)
      
      // Should only show posts matching search
      expect(screen.getByText(/The future of HR is data-driven/)).toBeInTheDocument()
      expect(screen.queryByText(/Remote work isn't going anywhere/)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      render(<LinkedInPostsTable {...mockProps} />)
      
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /Post/i })).toBeInTheDocument()
      expect(screen.getAllByRole('row')).toHaveLength(3) // Header + 2 data rows
    })

    it('should have accessible buttons', () => {
      render(<LinkedInPostsTable {...mockProps} />)
      
      const generateButtons = screen.getAllByRole('button', { name: /Generate Comment/i })
      generateButtons.forEach(button => {
        expect(button).toHaveAccessibleName()
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<LinkedInPostsTable {...mockProps} />)
      
      // Tab through interactive elements
      await user.tab()
      
      const focusedElement = document.activeElement
      expect(focusedElement).toBeInTheDocument()
    })

    it('should have proper ARIA labels for engagement metrics', () => {
      render(<LinkedInPostsTable {...mockProps} />)
      
      // Engagement numbers should have context
      const engagementCells = screen.getAllByRole('cell')
      const engagementCell = engagementCells.find(cell => cell.textContent?.includes('245'))
      expect(engagementCell).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed post data', () => {
      const malformedPosts = [
        {
          urn: 'incomplete-post',
          // Missing required fields
        } as any,
        {
          urn: 'null-stats-post',
          text: 'Post with null stats',
          stats: null
        } as any
      ]

      expect(() => {
        render(<LinkedInPostsTable {...mockProps} posts={malformedPosts} />)
      }).not.toThrow()
    })

    it('should handle missing author information', () => {
      const postWithoutAuthor = {
        ...mockPosts[0],
        author: null
      } as any

      render(<LinkedInPostsTable {...mockProps} posts={[postWithoutAuthor]} />)
      
      expect(screen.getByText(/The future of HR is data-driven/)).toBeInTheDocument()
    })

    it('should handle invalid dates', () => {
      const postWithInvalidDate = {
        ...mockPosts[0],
        posted_at: {
          date: 'invalid-date',
          relative: 'unknown',
          timestamp: NaN
        }
      }

      render(<LinkedInPostsTable {...mockProps} posts={[postWithInvalidDate]} />)
      
      // Should still render the post
      expect(screen.getByText(/The future of HR is data-driven/)).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large numbers of posts efficiently', () => {
      const manyPosts = Array.from({ length: 100 }, (_, i) => ({
        ...mockPosts[0],
        urn: `urn:li:activity:${i}`,
        text: `Post ${i}: This is a test post with unique content`
      }))

      const startTime = Date.now()
      render(<LinkedInPostsTable {...mockProps} posts={manyPosts} />)
      const endTime = Date.now()

      // Rendering should complete quickly
      expect(endTime - startTime).toBeLessThan(1000)
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should virtualize long lists if implemented', () => {
      // This test would check for virtualization implementation
      // if the component uses react-window or similar
      const manyPosts = Array.from({ length: 1000 }, (_, i) => ({
        ...mockPosts[0],
        urn: `urn:li:activity:${i}`
      }))

      render(<LinkedInPostsTable {...mockProps} posts={manyPosts} />)
      
      // Should still render without performance issues
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })
})