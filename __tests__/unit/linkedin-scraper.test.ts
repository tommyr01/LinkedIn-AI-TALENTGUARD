/**
 * Unit Tests for LinkedIn Scraper Service
 * Tests LinkedIn API integration and data processing
 */

import { LinkedInScraperService, extractUsernameFromLinkedInUrl } from '@/lib/linkedin-scraper'
import '@/test/mocks/linkedin.mock'

describe('LinkedInScraperService', () => {
  let scraper: LinkedInScraperService

  beforeEach(() => {
    scraper = new LinkedInScraperService()
    jest.clearAllMocks()
    
    // Mock environment variables
    process.env.RAPIDAPI_KEY = 'test-api-key-12345'
  })

  afterEach(() => {
    delete process.env.RAPIDAPI_KEY
  })

  describe('Constructor', () => {
    it('should initialize with API key from environment', () => {
      expect(scraper).toBeInstanceOf(LinkedInScraperService)
    })

    it('should throw error when API key is missing', () => {
      delete process.env.RAPIDAPI_KEY
      expect(() => new LinkedInScraperService()).toThrow('Missing RAPIDAPI_KEY environment variable')
    })
  })

  describe('getProfile', () => {
    it('should fetch LinkedIn profile successfully', async () => {
      const profile = await scraper.getProfile('johnsmith')

      expect(profile.success).toBe(true)
      expect(profile.data.basic_info.fullname).toBe('John Smith')
      expect(profile.data.basic_info.public_identifier).toBe('johnsmith')
      expect(profile.data.basic_info.headline).toContain('VP of People Operations')
      expect(profile.data.experience).toBeInstanceOf(Array)
      expect(profile.data.education).toBeInstanceOf(Array)
    })

    it('should handle profile not found', async () => {
      // Mock API returning failure
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          message: 'Profile not found'
        })
      })

      await expect(scraper.getProfile('nonexistent-user')).rejects.toThrow('Profile not found')
    })

    it('should handle API rate limiting', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded'
      })

      await expect(scraper.getProfile('ratelimited-user')).rejects.toThrow('LinkedIn API error: 429')
    })

    it('should include proper headers in API request', async () => {
      await scraper.getProfile('johnsmith')

      const mockFetch = global.fetch as jest.Mock
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('johnsmith'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-rapidapi-host': 'linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com',
            'x-rapidapi-key': 'test-api-key-12345'
          })
        })
      )
    })

    it('should URL encode username', async () => {
      const usernameWithSpecialChars = 'john-smith.2024'
      await scraper.getProfile(usernameWithSpecialChars)

      const mockFetch = global.fetch as jest.Mock
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(usernameWithSpecialChars)),
        expect.any(Object)
      )
    })
  })

  describe('getPosts', () => {
    it('should fetch LinkedIn posts successfully', async () => {
      const posts = await scraper.getPosts('johnsmith')

      expect(posts.success).toBe(true)
      expect(posts.data.posts).toBeInstanceOf(Array)
      expect(posts.data.total_posts).toBeGreaterThanOrEqual(0)
      expect(posts.data.page_number).toBe(1)
    })

    it('should handle pagination', async () => {
      const posts = await scraper.getPosts('johnsmith', 2)

      expect(posts.data.page_number).toBe(2)
    })

    it('should validate post structure', async () => {
      const posts = await scraper.getPosts('johnsmith')

      if (posts.data.posts.length > 0) {
        const post = posts.data.posts[0]
        expect(post).toHaveProperty('urn')
        expect(post).toHaveProperty('text')
        expect(post).toHaveProperty('url')
        expect(post).toHaveProperty('stats')
        expect(post.stats).toHaveProperty('total_reactions')
        expect(post.stats).toHaveProperty('comments')
        expect(post).toHaveProperty('author')
      }
    })
  })

  describe('getAllPosts', () => {
    it('should fetch multiple pages of posts', async () => {
      // Mock multiple pages
      const mockFetch = global.fetch as jest.Mock
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              posts: [{ urn: 'post1', text: 'Post 1' }],
              has_more: true,
              page_number: 1
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              posts: [{ urn: 'post2', text: 'Post 2' }],
              has_more: false,
              page_number: 2
            }
          })
        })

      const allPosts = await scraper.getAllPosts('johnsmith', 50)

      expect(allPosts).toBeInstanceOf(Array)
      expect(mockFetch).toHaveBeenCalledTimes(2) // Should fetch 2 pages
    })

    it('should respect maxPosts limit', async () => {
      const allPosts = await scraper.getAllPosts('johnsmith', 5)

      expect(allPosts.length).toBeLessThanOrEqual(5)
    })

    it('should add delay between requests', async () => {
      const startTime = Date.now()
      
      // Mock multiple pages to trigger delay
      const mockFetch = global.fetch as jest.Mock
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              posts: Array.from({length: 10}, (_, i) => ({ urn: `post${i}`, text: `Post ${i}` })),
              has_more: true,
              page_number: 1
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              posts: Array.from({length: 10}, (_, i) => ({ urn: `post${i+10}`, text: `Post ${i+10}` })),
              has_more: false,
              page_number: 2
            }
          })
        })

      await scraper.getAllPosts('johnsmith', 20)
      
      const endTime = Date.now()
      expect(endTime - startTime).toBeGreaterThan(450) // At least 500ms delay minus some buffer
    })
  })

  describe('getPostComments', () => {
    const mockPostUrl = 'https://www.linkedin.com/posts/johnsmith_hrtech-activity-123456'

    it('should fetch post comments successfully', async () => {
      const comments = await scraper.getPostComments(mockPostUrl)

      expect(comments.success).toBe(true)
      expect(comments.data.comments).toBeInstanceOf(Array)
      expect(comments.data.post.url).toBe(mockPostUrl)
    })

    it('should handle different sort orders', async () => {
      const sortOrders = ['Most relevant', 'Most recent']

      for (const sortOrder of sortOrders) {
        const comments = await scraper.getPostComments(mockPostUrl, 1, sortOrder)
        expect(comments.success).toBe(true)
      }
    })

    it('should validate comment structure', async () => {
      const comments = await scraper.getPostComments(mockPostUrl)

      if (comments.data.comments.length > 0) {
        const comment = comments.data.comments[0]
        expect(comment).toHaveProperty('comment_id')
        expect(comment).toHaveProperty('text')
        expect(comment).toHaveProperty('author')
        expect(comment).toHaveProperty('stats')
        expect(comment.author).toHaveProperty('name')
        expect(comment.author).toHaveProperty('headline')
      }
    })

    it('should URL encode post URL', async () => {
      const urlWithParams = 'https://www.linkedin.com/posts/activity-123456?utm_source=share&utm_medium=member_desktop'
      await scraper.getPostComments(urlWithParams)

      const mockFetch = global.fetch as jest.Mock
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(urlWithParams)),
        expect.any(Object)
      )
    })
  })

  describe('mapToAirtableFields', () => {
    const mockProfile = {
      success: true,
      message: 'Success',
      data: {
        basic_info: {
          fullname: 'Sarah Johnson',
          first_name: 'Sarah',
          last_name: 'Johnson',
          headline: 'VP of People Operations',
          public_identifier: 'sarahjohnson',
          about: 'Passionate about HR transformation',
          location: { full: 'San Francisco, CA, United States' },
          creator_hashtags: ['#hrtech', '#talentmanagement'],
          is_creator: true,
          is_influencer: false,
          is_premium: true,
          follower_count: 5420,
          connection_count: 2500,
          current_company: 'TechCorp Inc',
          current_company_url: 'https://linkedin.com/company/techcorp'
        },
        experience: [{
          title: 'VP of People Operations',
          company: 'TechCorp Inc',
          is_current: true,
          start_date: { year: 2022, month: 'Jan' },
          company_linkedin_url: 'https://linkedin.com/company/techcorp'
        }]
      }
    }

    it('should map profile data to Airtable format', () => {
      const mapped = scraper.mapToAirtableFields(mockProfile)

      expect(mapped['Full Name']).toBe('Sarah Johnson')
      expect(mapped['First Name']).toBe('Sarah')
      expect(mapped['Last Name']).toBe('Johnson')
      expect(mapped['Headline']).toBe('VP of People Operations')
      expect(mapped['Username']).toBe('sarahjohnson')
      expect(mapped['Current Company']).toBe('TechCorp Inc')
      expect(mapped['Title']).toBe('VP of People Operations')
      expect(mapped['Follower Count']).toBe(5420)
      expect(mapped['Connection Count']).toBe(2500)
    })

    it('should format start date correctly', () => {
      const mapped = scraper.mapToAirtableFields(mockProfile)
      expect(mapped['Start Date']).toBe('2022-01-01')
    })

    it('should handle missing current job gracefully', () => {
      const profileWithoutCurrentJob = {
        ...mockProfile,
        data: {
          ...mockProfile.data,
          basic_info: {
            ...mockProfile.data.basic_info,
            current_company: ''
          },
          experience: []
        }
      }

      const mapped = scraper.mapToAirtableFields(profileWithoutCurrentJob)
      expect(mapped['Current Company']).toBe('')
      expect(mapped['Title']).toBe('')
      expect(mapped['Start Date']).toBe('')
    })

    it('should join hashtags correctly', () => {
      const mapped = scraper.mapToAirtableFields(mockProfile)
      expect(mapped['Hashtags']).toBe('#hrtech, #talentmanagement')
    })
  })

  describe('Helper Methods', () => {
    it('should convert month names to numbers', () => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Dec']
      const expectedNumbers = [1, 2, 3, 12]

      monthNames.forEach((month, index) => {
        const monthNumber = scraper['getMonthNumber'](month)
        expect(monthNumber).toBe(expectedNumbers[index])
      })
    })

    it('should handle invalid month names', () => {
      const invalidMonth = scraper['getMonthNumber']('InvalidMonth')
      expect(invalidMonth).toBe(1) // Default to January
    })
  })

  describe('getProfilePictureAsAttachment', () => {
    it('should return attachment object for valid URL', async () => {
      const pictureUrl = 'https://media.licdn.com/dms/image/profile.jpg'
      const attachment = await scraper.getProfilePictureAsAttachment(pictureUrl)

      expect(attachment).toEqual({
        url: pictureUrl,
        filename: 'profile-picture.jpg'
      })
    })

    it('should return null for empty URL', async () => {
      const attachment = await scraper.getProfilePictureAsAttachment('')
      expect(attachment).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      const attachment = await scraper.getProfilePictureAsAttachment('invalid-url')
      expect(attachment).toBeNull()
    })
  })
})

describe('extractUsernameFromLinkedInUrl', () => {
  it('should extract username from standard LinkedIn URLs', () => {
    const testCases = [
      { url: 'https://www.linkedin.com/in/johnsmith', expected: 'johnsmith' },
      { url: 'https://linkedin.com/in/sarah-johnson', expected: 'sarah-johnson' },
      { url: 'http://www.linkedin.com/in/mike.wilson/', expected: 'mike.wilson' },
      { url: 'LinkedIn.com/in/jane_doe?utm_source=share', expected: 'jane_doe' }
    ]

    testCases.forEach(({ url, expected }) => {
      const result = extractUsernameFromLinkedInUrl(url)
      expect(result).toBe(expected)
    })
  })

  it('should return original string for invalid URLs', () => {
    const invalidUrls = [
      'not-a-linkedin-url',
      'https://facebook.com/profile',
      'https://linkedin.com/company/techcorp'
    ]

    invalidUrls.forEach(url => {
      const result = extractUsernameFromLinkedInUrl(url)
      expect(result).toBe(url)
    })
  })

  it('should handle case insensitive URLs', () => {
    const url = 'HTTPS://WWW.LINKEDIN.COM/IN/JohnSmith'
    const result = extractUsernameFromLinkedInUrl(url)
    expect(result).toBe('JohnSmith')
  })
})