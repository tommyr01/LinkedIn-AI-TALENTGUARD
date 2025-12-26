import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OptimizedLinkedInPostsTable, type LinkedInPost, type PostStats } from '@/components/linkedin-posts/optimized-posts-table'

const mockPosts: LinkedInPost[] = [
  {
    id: '1',
    connectionName: 'John Doe',
    connectionCompany: 'TechCorp',
    content: 'Excited to share our latest insights on AI technology',
    postedAt: '2024-01-15T10:00:00Z',
    postUrn: 'urn:li:activity:123',
    postUrl: 'https://linkedin.com/posts/123',
    likesCount: 25,
    commentsCount: 5,
    totalReactions: 30,
    reposts: 3,
    authorFirstName: 'John',
    authorLastName: 'Doe',
    authorHeadline: 'CEO at TechCorp',
    authorProfilePicture: 'https://example.com/avatar.jpg',
    postType: 'article',
    createdTime: '2024-01-15T10:00:00Z',
    hasMedia: true,
    documentTitle: 'AI Technology Trends',
    documentPageCount: 10,
    support: 5,
    love: 3,
    insight: 2,
    celebrate: 1,
  },
  {
    id: '2',
    connectionName: 'Jane Smith',
    connectionCompany: 'DataCorp',
    content: 'Reflecting on a successful quarter and planning for the future',
    postedAt: '2024-01-10T14:30:00Z',
    postUrn: 'urn:li:activity:124',
    likesCount: 15,
    commentsCount: 3,
    totalReactions: 18,
    reposts: 1,
    authorFirstName: 'Jane',
    authorLastName: 'Smith',
    postType: 'status',
    createdTime: '2024-01-10T14:30:00Z',
    hasMedia: false,
  }
]

const mockStats: PostStats = {
  totalPosts: 2,
  totalLikes: 40,
  totalComments: 8,
  totalReactions: 48,
  uniqueConnections: 2,
  averageEngagement: 24,
  totalReposts: 4,
  totalSupport: 5,
  totalLove: 3,
  totalInsight: 2,
  totalCelebrate: 1,
  postsWithMedia: 1,
  documentsShared: 1,
}

describe('OptimizedLinkedInPostsTable', () => {
  const mockOnRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock window.open
    Object.defineProperty(window, 'open', {
      writable: true,
      value: jest.fn()
    })
  })

  it('renders posts correctly', () => {
    render(
      <OptimizedLinkedInPostsTable
        posts={mockPosts}
        stats={mockStats}
        onRefresh={mockOnRefresh}
      />
    )

    expect(screen.getByText('Your LinkedIn Posts')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('TechCorp')).toBeInTheDocument()
    expect(screen.getByText('DataCorp')).toBeInTheDocument()
  })

  it('shows loading state correctly', () => {
    render(
      <OptimizedLinkedInPostsTable
        posts={mockPosts}
        stats={mockStats}
        onRefresh={mockOnRefresh}
        isLoading={true}
      />
    )

    // Should show skeleton loaders instead of posts
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })

  it('shows empty state when no posts', () => {
    render(
      <OptimizedLinkedInPostsTable
        posts={[]}
        stats={mockStats}
        onRefresh={mockOnRefresh}
      />
    )

    expect(screen.getByText('No posts found')).toBeInTheDocument()
  })

  it('filters posts by search term', async () => {
    const user = userEvent.setup()
    render(
      <OptimizedLinkedInPostsTable
        posts={mockPosts}
        stats={mockStats}
        onRefresh={mockOnRefresh}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search posts or content...')
    await user.type(searchInput, 'AI technology')

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
  })

  it('filters posts by time period', async () => {
    const user = userEvent.setup()
    render(
      <OptimizedLinkedInPostsTable
        posts={mockPosts}
        stats={mockStats}
        onRefresh={mockOnRefresh}
      />
    )

    const todayButton = screen.getByRole('button', { name: 'Today' })
    await user.click(todayButton)

    // Both posts are from past dates, so none should show
    expect(screen.getByText('No posts found')).toBeInTheDocument()
  })

  it('toggles between grid and list view', async () => {
    const user = userEvent.setup()
    render(
      <OptimizedLinkedInPostsTable
        posts={mockPosts}
        stats={mockStats}
        onRefresh={mockOnRefresh}
      />
    )

    const viewToggleButton = screen.getByLabelText(/switch to list view/i)
    await user.click(viewToggleButton)

    // Should switch to list view
    expect(screen.getByLabelText(/switch to grid view/i)).toBeInTheDocument()
  })

  it('calls refresh when refresh button clicked', async () => {
    const user = userEvent.setup()
    render(
      <OptimizedLinkedInPostsTable
        posts={mockPosts}
        stats={mockStats}
        onRefresh={mockOnRefresh}
      />
    )

    const refreshButton = screen.getByRole('button', { name: 'Refresh' })
    await user.click(refreshButton)

    expect(mockOnRefresh).toHaveBeenCalledTimes(1)
  })

  it('opens external links correctly', async () => {
    const user = userEvent.setup()
    const mockWindowOpen = jest.fn()
    Object.defineProperty(window, 'open', {
      writable: true,
      value: mockWindowOpen
    })

    render(
      <OptimizedLinkedInPostsTable
        posts={mockPosts}
        stats={mockStats}
        onRefresh={mockOnRefresh}
      />
    )

    const externalLinkButtons = screen.getAllByLabelText('Open post in LinkedIn')
    await user.click(externalLinkButtons[0])

    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://linkedin.com/posts/123',
      '_blank',
      'noopener,noreferrer'
    )
  })

  it('displays engagement metrics correctly', () => {
    render(
      <OptimizedLinkedInPostsTable
        posts={mockPosts}
        stats={mockStats}
        onRefresh={mockOnRefresh}
      />
    )

    // Check engagement numbers
    expect(screen.getByText('25 likes')).toBeInTheDocument()
    expect(screen.getByText('5 comments')).toBeInTheDocument()
    expect(screen.getByText('30 total reactions')).toBeInTheDocument()
    expect(screen.getByText('3 reposts')).toBeInTheDocument()
  })

  it('displays document information when available', () => {
    render(
      <OptimizedLinkedInPostsTable
        posts={mockPosts}
        stats={mockStats}
        onRefresh={mockOnRefresh}
      />
    )

    expect(screen.getByText('AI Technology Trends')).toBeInTheDocument()
    expect(screen.getByText('10 pages')).toBeInTheDocument()
  })

  it('shows extended engagement reactions', () => {
    render(
      <OptimizedLinkedInPostsTable
        posts={mockPosts}
        stats={mockStats}
        onRefresh={mockOnRefresh}
      />
    )

    expect(screen.getByText('👏 5')).toBeInTheDocument() // support
    expect(screen.getByText('❤️ 3')).toBeInTheDocument() // love
    expect(screen.getByText('💡 2')).toBeInTheDocument() // insight
    expect(screen.getByText('🎉 1')).toBeInTheDocument() // celebrate
  })

  it('handles pagination correctly', async () => {
    // Create enough posts to trigger pagination
    const manyPosts = Array.from({ length: 15 }, (_, i) => ({
      ...mockPosts[0],
      id: `post-${i}`,
      connectionName: `User ${i}`,
      postUrn: `urn:li:activity:${i}`
    }))

    const user = userEvent.setup()
    render(
      <OptimizedLinkedInPostsTable
        posts={manyPosts}
        stats={mockStats}
        onRefresh={mockOnRefresh}
      />
    )

    // Should show pagination controls
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText('Previous')).toBeInTheDocument()

    // Click next page
    const nextButton = screen.getByRole('button', { name: 'Next' })
    await user.click(nextButton)

    // Should show remaining posts
    expect(screen.getByText(/showing \d+ to \d+ of 15 posts/i)).toBeInTheDocument()
  })

  it('resets pagination when search changes', async () => {
    const manyPosts = Array.from({ length: 15 }, (_, i) => ({
      ...mockPosts[0],
      id: `post-${i}`,
      connectionName: i < 5 ? `AI User ${i}` : `User ${i}`,
      postUrn: `urn:li:activity:${i}`
    }))

    const user = userEvent.setup()
    render(
      <OptimizedLinkedInPostsTable
        posts={manyPosts}
        stats={mockStats}
        onRefresh={mockOnRefresh}
      />
    )

    // Go to page 2
    const nextButton = screen.getByRole('button', { name: 'Next' })
    await user.click(nextButton)

    // Search for something that will reduce results
    const searchInput = screen.getByPlaceholderText('Search posts or content...')
    await user.type(searchInput, 'AI')

    // Should reset to page 1 and show filtered results
    expect(screen.getByText(/showing 1 to \d+ of 5 posts \(filtered\)/i)).toBeInTheDocument()
  })

  it('displays proper accessibility attributes', () => {
    render(
      <OptimizedLinkedInPostsTable
        posts={mockPosts}
        stats={mockStats}
        onRefresh={mockOnRefresh}
      />
    )

    // Check for proper ARIA labels
    expect(screen.getByLabelText(/switch to list view/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Open post in LinkedIn')).toBeInTheDocument()
    
    // Check for proper headings
    expect(screen.getByRole('heading', { name: 'Your LinkedIn Posts' })).toBeInTheDocument()
  })

  it('formats dates correctly', () => {
    render(
      <OptimizedLinkedInPostsTable
        posts={mockPosts}
        stats={mockStats}
        onRefresh={mockOnRefresh}
      />
    )

    // Should format dates without year if current year
    expect(screen.getByText('Jan 15')).toBeInTheDocument()
    expect(screen.getByText('Jan 10')).toBeInTheDocument()
  })
})