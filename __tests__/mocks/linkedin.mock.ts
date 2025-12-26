/**
 * Mock LinkedIn scraper service for testing
 * Provides realistic LinkedIn data responses
 */

import type { LinkedInProfile, LinkedInPost, LinkedInPostComments } from '@/lib/linkedin-scraper'

export const mockLinkedInProfile: LinkedInProfile = {
  success: true,
  message: 'Profile fetched successfully',
  data: {
    basic_info: {
      fullname: 'John Smith',
      first_name: 'John',
      last_name: 'Smith',
      headline: 'VP of People Operations | HR Technology Leader',
      public_identifier: 'johnsmith',
      profile_picture_url: 'https://media.licdn.com/dms/image/profile.jpg',
      about: 'Passionate about transforming HR through technology and data-driven insights.',
      location: {
        country: 'United States',
        city: 'San Francisco',
        full: 'San Francisco, California, United States',
        country_code: 'US'
      },
      creator_hashtags: ['#hrtech', '#talentmanagement'],
      is_creator: true,
      is_influencer: false,
      is_premium: true,
      show_follower_count: true,
      background_picture_url: 'https://media.licdn.com/dms/image/background.jpg',
      urn: 'urn:li:person:ABC123',
      follower_count: 5420,
      connection_count: 2500,
      current_company: 'TechCorp Inc',
      current_company_urn: 'urn:li:company:12345',
      current_company_url: 'https://www.linkedin.com/company/techcorp'
    },
    experience: [
      {
        title: 'VP of People Operations',
        company: 'TechCorp Inc',
        location: 'San Francisco, CA',
        description: 'Leading HR transformation initiatives across 500+ employee organization',
        duration: '2 years 3 months',
        start_date: { year: 2022, month: 'Jan' },
        is_current: true,
        company_linkedin_url: 'https://www.linkedin.com/company/techcorp',
        company_id: '12345'
      }
    ],
    education: [
      {
        school: 'Stanford University',
        degree: 'MBA',
        field_of_study: 'Organizational Behavior',
        duration: '2018-2020',
        start_date: { year: 2018 },
        end_date: { year: 2020 }
      }
    ],
    certifications: [
      {
        name: 'Certified People Analytics Professional',
        issuer: 'HRCI',
        issued_date: 'Jan 2023'
      }
    ]
  }
}

export const mockLinkedInPosts: LinkedInPost = {
  success: true,
  message: 'Posts fetched successfully',
  data: {
    posts: [
      {
        urn: 'urn:li:activity:123456',
        full_urn: 'urn:li:activity:123456789',
        text: 'The future of HR is data-driven. Here are 5 key metrics every People leader should track...',
        url: 'https://www.linkedin.com/posts/johnsmith_hrtech-data-activity-123456',
        post_type: 'text',
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
          profile_picture: 'https://media.licdn.com/dms/image/profile.jpg'
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
      }
    ],
    total_posts: 1,
    page_number: 1,
    has_more: false
  }
}

export const mockLinkedInComments: LinkedInPostComments = {
  success: true,
  message: 'Comments fetched successfully',
  data: {
    post: {
      id: '123456',
      url: 'https://www.linkedin.com/posts/johnsmith_hrtech-activity-123456'
    },
    comments: [
      {
        comment_id: 'comment123',
        text: 'Great insights on HR metrics! Data-driven decision making is crucial.',
        posted_at: {
          timestamp: 1705420800,
          date: '2024-01-16',
          relative: '1 day ago'
        },
        is_edited: false,
        is_pinned: false,
        comment_url: 'https://www.linkedin.com/posts/activity-123456/comment-comment123',
        author: {
          name: 'Sarah Johnson',
          headline: 'Chief People Officer at StartupCo',
          profile_url: 'https://www.linkedin.com/in/sarahjohnson',
          profile_picture: 'https://media.licdn.com/dms/image/sarah.jpg'
        },
        stats: {
          total_reactions: 12,
          reactions: {
            like: 10,
            appreciation: 1,
            empathy: 0,
            interest: 1,
            praise: 0
          },
          comments: 0
        }
      }
    ],
    total: 1
  }
}

export const createMockLinkedInScraper = () => ({
  getProfile: jest.fn().mockResolvedValue(mockLinkedInProfile),
  getPosts: jest.fn().mockResolvedValue(mockLinkedInPosts),
  getAllPosts: jest.fn().mockResolvedValue(mockLinkedInPosts.data.posts),
  getPostComments: jest.fn().mockResolvedValue(mockLinkedInComments),
  mapToAirtableFields: jest.fn().mockReturnValue({
    'Full Name': 'John Smith',
    'First Name': 'John',
    'Last Name': 'Smith',
    'Headline': 'VP of People Operations | HR Technology Leader',
    'Username': 'johnsmith',
    'Current Company': 'TechCorp Inc',
    'Title': 'VP of People Operations',
    'Follower Count': 5420,
    'Connection Count': 2500
  })
})

// Jest mock for LinkedIn scraper module  
jest.mock('@/lib/linkedin-scraper', () => ({
  LinkedInScraperService: jest.fn().mockImplementation(() => createMockLinkedInScraper()),
  linkedInScraper: createMockLinkedInScraper(),
  extractUsernameFromLinkedInUrl: jest.fn().mockImplementation((url: string) => {
    const match = url.match(/linkedin\.com\/in\/([^/]+)/i)
    return match ? match[1] : 'test-user'
  })
}))

export const mockLinkedInScraper = createMockLinkedInScraper()