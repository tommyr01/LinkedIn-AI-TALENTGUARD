/**
 * Mock OpenAI service for testing
 * Provides predictable responses for AI processing tests
 */

export interface MockOpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export const mockOpenAIResponses = {
  intelligenceAnalysis: {
    choices: [{
      message: {
        content: JSON.stringify({
          insights: [
            {
              type: 'pain_point',
              description: 'Difficulty with performance reviews consistency',
              priority: 'high',
              source: 'Meeting transcript',
              date: '2024-01-15',
              quotes: ['We struggle with standardizing our review process across teams']
            }
          ],
          opportunities: [
            {
              title: 'Performance Review Standardization',
              need: 'Consistent review framework across organization',
              validation: 'strong',
              product: 'TalentGuard Performance Suite'
            }
          ],
          stakeholders: {
            decisionMakers: [
              {
                name: 'Sarah Johnson',
                title: 'VP of People',
                department: 'HR',
                painPoints: ['Inconsistent reviews', 'Manual processes']
              }
            ]
          }
        })
      }
    }]
  },
  commentGeneration: {
    choices: [{
      message: {
        content: 'Great insights on talent development strategies! Your emphasis on data-driven performance management aligns perfectly with modern HR transformation initiatives.'
      }
    }]
  },
  scoringAnalysis: {
    choices: [{
      message: {
        content: JSON.stringify({
          overallExpertise: 85,
          talentManagement: 90,
          peopleDevelopment: 80,
          hrTechnology: 75,
          thoughtLeadership: 85,
          strengths: [
            'Deep expertise in performance management',
            'Strong understanding of HR technology',
            'Proven thought leadership in talent development'
          ],
          recommendations: [
            'Focus on performance review automation needs',
            'Emphasize ROI of unified talent platform',
            'Leverage their thought leadership for case studies'
          ]
        })
      }
    }]
  }
}

export const createMockOpenAI = () => ({
  chat: {
    completions: {
      create: jest.fn().mockImplementation(async (params: any) => {
        const { messages } = params
        const userMessage = messages.find((m: any) => m.role === 'user')?.content || ''
        
        if (userMessage.includes('intelligence') || userMessage.includes('analysis')) {
          return mockOpenAIResponses.intelligenceAnalysis
        }
        
        if (userMessage.includes('comment') || userMessage.includes('reply')) {
          return mockOpenAIResponses.commentGeneration
        }
        
        if (userMessage.includes('score') || userMessage.includes('expertise')) {
          return mockOpenAIResponses.scoringAnalysis
        }
        
        // Default response
        return {
          choices: [{
            message: {
              content: 'Mock OpenAI response'
            }
          }]
        }
      })
    }
  }
})

// Jest mock for OpenAI module
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => createMockOpenAI())
}))

export const mockOpenAI = createMockOpenAI()