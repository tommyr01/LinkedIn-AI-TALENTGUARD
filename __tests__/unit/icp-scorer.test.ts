/**
 * Unit Tests for ICP Scorer
 * Tests TalentGuard-specific scoring algorithms
 */

import { ICPScorer } from '@/lib/icp-scorer'
import '@/test/mocks/openai.mock'

describe('ICPScorer', () => {
  let scorer: ICPScorer

  beforeEach(() => {
    scorer = new ICPScorer()
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize successfully', () => {
      expect(scorer).toBeInstanceOf(ICPScorer)
    })
  })

  describe('scoreProfile', () => {
    const mockLinkedInData = {
      basic_info: {
        fullname: 'Sarah Johnson',
        headline: 'VP of People Operations | HR Technology Leader',
        about: 'Passionate about transforming HR through technology and data-driven insights. Expert in talent management, performance reviews, and people analytics.',
        current_company: 'TechCorp Inc',
        follower_count: 5420,
        connection_count: 2500
      },
      experience: [
        {
          title: 'VP of People Operations',
          company: 'TechCorp Inc',
          description: 'Leading HR transformation initiatives, implementing new performance management systems, and driving people analytics adoption.',
          duration: '2 years 3 months',
          is_current: true
        },
        {
          title: 'Senior HR Director',
          company: 'StartupCorp',
          description: 'Built HR infrastructure from ground up, managed talent acquisition and employee development programs.',
          duration: '3 years',
          is_current: false
        }
      ]
    }

    const mockCompanyData = {
      name: 'TechCorp Inc',
      industry: 'Technology',
      size: '500-1000 employees',
      recentFunding: '$50M Series B',
      growthStage: 'scale-up'
    }

    it('should generate valid overall expertise score', async () => {
      const result = await scorer.scoreProfile(mockLinkedInData, mockCompanyData)

      expect(result.overallExpertise).toBeGreaterThanOrEqual(0)
      expect(result.overallExpertise).toBeLessThanOrEqual(100)
      expect(typeof result.overallExpertise).toBe('number')
    })

    it('should generate all required score categories', async () => {
      const result = await scorer.scoreProfile(mockLinkedInData, mockCompanyData)

      expect(result).toHaveProperty('talentManagement')
      expect(result).toHaveProperty('peopleDevelopment')
      expect(result).toHaveProperty('hrTechnology')
      expect(result).toHaveProperty('practicalExperience')
      expect(result).toHaveProperty('thoughtLeadership')

      // All scores should be valid numbers between 0-100
      Object.values(result).forEach(score => {
        expect(typeof score).toBe('number')
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
      })
    })

    it('should score talent management expertise higher for relevant roles', async () => {
      const talentMgmtProfile = {
        ...mockLinkedInData,
        basic_info: {
          ...mockLinkedInData.basic_info,
          headline: 'Chief People Officer | Talent Management Expert',
          about: 'Specializing in talent acquisition, performance management, succession planning, and organizational development.'
        }
      }

      const result = await scorer.scoreProfile(talentMgmtProfile, mockCompanyData)
      
      expect(result.talentManagement).toBeGreaterThan(70)
    })

    it('should score HR technology expertise for tech-focused profiles', async () => {
      const hrTechProfile = {
        ...mockLinkedInData,
        basic_info: {
          ...mockLinkedInData.basic_info,
          headline: 'HR Technology Director | HRIS Implementation Specialist',
          about: 'Expert in HR technology stack, HRIS implementations, people analytics platforms, and HR digital transformation.'
        }
      }

      const result = await scorer.scoreProfile(hrTechProfile, mockCompanyData)
      
      expect(result.hrTechnology).toBeGreaterThan(75)
    })

    it('should factor in experience duration for practical experience score', async () => {
      const experiencedProfile = {
        ...mockLinkedInData,
        experience: [
          ...mockLinkedInData.experience,
          {
            title: 'HR Manager',
            company: 'Previous Corp',
            description: 'Managed full employee lifecycle and HR operations.',
            duration: '4 years',
            is_current: false
          },
          {
            title: 'HR Business Partner',
            company: 'Another Corp',
            description: 'Strategic HR partnership with business leaders.',
            duration: '3 years',
            is_current: false
          }
        ]
      }

      const result = await scorer.scoreProfile(experiencedProfile, mockCompanyData)
      
      expect(result.practicalExperience).toBeGreaterThan(60)
    })

    it('should consider follower count for thought leadership score', async () => {
      const influencerProfile = {
        ...mockLinkedInData,
        basic_info: {
          ...mockLinkedInData.basic_info,
          follower_count: 25000, // High follower count
          headline: 'HR Thought Leader | Speaker | Author'
        }
      }

      const result = await scorer.scoreProfile(influencerProfile, mockCompanyData)
      
      expect(result.thoughtLeadership).toBeGreaterThan(65)
    })
  })

  describe('calculateTalentManagementScore', () => {
    it('should score high for talent management keywords', () => {
      const profile = {
        basic_info: {
          headline: 'VP of Talent Management',
          about: 'Expert in performance management, succession planning, and talent development'
        },
        experience: [{
          title: 'Director of Talent Acquisition',
          description: 'Led talent acquisition strategy and built high-performing teams'
        }]
      }

      const score = scorer['calculateTalentManagementScore'](profile)
      expect(score).toBeGreaterThan(70)
    })

    it('should score lower for unrelated roles', () => {
      const profile = {
        basic_info: {
          headline: 'Software Engineer',
          about: 'Full-stack developer with expertise in React and Node.js'
        },
        experience: [{
          title: 'Senior Developer',
          description: 'Built web applications and APIs'
        }]
      }

      const score = scorer['calculateTalentManagementScore'](profile)
      expect(score).toBeLessThan(30)
    })
  })

  describe('calculateHRTechnologyScore', () => {
    it('should score high for HR tech experience', () => {
      const profile = {
        basic_info: {
          headline: 'HRIS Director | HR Technology Leader',
          about: 'Expert in Workday, SuccessFactors, BambooHR implementation and people analytics'
        },
        experience: [{
          title: 'HR Technology Manager',
          description: 'Implemented HRIS systems and automated HR processes'
        }]
      }

      const score = scorer['calculateHRTechnologyScore'](profile)
      expect(score).toBeGreaterThan(75)
    })

    it('should recognize specific HR tech platforms', () => {
      const hrPlatforms = ['Workday', 'SuccessFactors', 'BambooHR', 'Greenhouse', 'Lever', 'ADP']
      
      hrPlatforms.forEach(platform => {
        const profile = {
          basic_info: {
            headline: `${platform} Administrator`,
            about: `Experienced in ${platform} implementation and management`
          },
          experience: [{
            title: 'HRIS Specialist',
            description: `Managed ${platform} system for 1000+ employees`
          }]
        }

        const score = scorer['calculateHRTechnologyScore'](profile)
        expect(score).toBeGreaterThan(60)
      })
    })
  })

  describe('calculatePeopleDevelopmentScore', () => {
    it('should score high for L&D and development roles', () => {
      const profile = {
        basic_info: {
          headline: 'Chief Learning Officer',
          about: 'Learning and development expert focused on leadership development and organizational capability building'
        },
        experience: [{
          title: 'Director of Learning & Development',
          description: 'Designed and implemented leadership development programs and learning curricula'
        }]
      }

      const score = scorer['calculatePeopleDevelopmentScore'](profile)
      expect(score).toBeGreaterThan(80)
    })
  })

  describe('calculateThoughtLeadershipScore', () => {
    it('should consider follower count in scoring', () => {
      const highFollowerProfile = {
        basic_info: { follower_count: 50000 }
      }

      const lowFollowerProfile = {
        basic_info: { follower_count: 500 }
      }

      const highScore = scorer['calculateThoughtLeadershipScore'](highFollowerProfile)
      const lowScore = scorer['calculateThoughtLeadershipScore'](lowFollowerProfile)

      expect(highScore).toBeGreaterThan(lowScore)
    })

    it('should recognize thought leadership keywords', () => {
      const profile = {
        basic_info: {
          headline: 'HR Keynote Speaker | Author | Thought Leader',
          about: 'Published author of "The Future of Work" and frequent conference speaker on HR innovation',
          follower_count: 10000
        }
      }

      const score = scorer['calculateThoughtLeadershipScore'](profile)
      expect(score).toBeGreaterThan(70)
    })
  })

  describe('calculatePracticalExperienceScore', () => {
    it('should factor in years of experience', () => {
      const seniorProfile = {
        experience: [
          { title: 'CHRO', duration: '5 years', is_current: true },
          { title: 'VP People', duration: '4 years', is_current: false },
          { title: 'HR Director', duration: '6 years', is_current: false }
        ]
      }

      const juniorProfile = {
        experience: [
          { title: 'HR Coordinator', duration: '1 year', is_current: true }
        ]
      }

      const seniorScore = scorer['calculatePracticalExperienceScore'](seniorProfile)
      const juniorScore = scorer['calculatePracticalExperienceScore'](juniorProfile)

      expect(seniorScore).toBeGreaterThan(juniorScore)
    })

    it('should recognize seniority levels', () => {
      const executiveProfile = {
        experience: [
          { title: 'Chief People Officer', duration: '3 years', is_current: true }
        ]
      }

      const score = scorer['calculatePracticalExperienceScore'](executiveProfile)
      expect(score).toBeGreaterThan(70)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing profile data gracefully', async () => {
      const incompleteProfile = {
        basic_info: {
          fullname: 'John Doe'
          // Missing other fields
        }
      }

      const result = await scorer.scoreProfile(incompleteProfile, {})
      
      expect(result.overallExpertise).toBeGreaterThanOrEqual(0)
      expect(result.overallExpertise).toBeLessThanOrEqual(100)
    })

    it('should handle empty experience array', async () => {
      const profileWithoutExperience = {
        basic_info: {
          headline: 'HR Professional',
          about: 'HR expert'
        },
        experience: []
      }

      const result = await scorer.scoreProfile(profileWithoutExperience, {})
      
      expect(typeof result.practicalExperience).toBe('number')
      expect(result.practicalExperience).toBeGreaterThanOrEqual(0)
    })

    it('should handle null/undefined values', async () => {
      const profileWithNulls = {
        basic_info: {
          headline: null,
          about: undefined,
          follower_count: null
        },
        experience: null
      }

      const result = await scorer.scoreProfile(profileWithNulls, {})
      
      // Should not throw errors and return valid scores
      Object.values(result).forEach(score => {
        expect(typeof score).toBe('number')
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
      })
    })

    it('should normalize scores to 0-100 range', async () => {
      // Test with extreme values that might cause scores > 100
      const extremeProfile = {
        basic_info: {
          headline: 'Chief People Officer VP Talent Management Director HR Technology HRIS Workday Expert',
          about: 'talent management performance management people development learning development HR technology HRIS analytics'.repeat(10),
          follower_count: 1000000,
          connection_count: 50000
        },
        experience: Array.from({length: 20}, (_, i) => ({
          title: 'Chief People Officer',
          duration: '10 years',
          description: 'talent management performance management people development',
          is_current: i === 0
        }))
      }

      const result = await scorer.scoreProfile(extremeProfile, {})
      
      Object.values(result).forEach(score => {
        expect(score).toBeLessThanOrEqual(100)
        expect(score).toBeGreaterThanOrEqual(0)
      })
    })
  })
})