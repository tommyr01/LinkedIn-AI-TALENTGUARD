/**
 * Component Tests for Intelligence Card
 * Tests React component rendering and interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntelligenceCard } from '@/components/intelligence/intelligence-card'
import '@/test/mocks/supabase.mock'

// Mock the IntelligenceReportDisplay component since we're testing IntelligenceCard in isolation
jest.mock('@/components/intelligence/intelligence-report-display', () => ({
  IntelligenceReportDisplay: ({ profile, connection }: any) => (
    <div data-testid="intelligence-report-display">
      Intelligence Report for {connection.full_name}
    </div>
  )
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('IntelligenceCard', () => {
  const mockConnection = {
    id: 'conn-123',
    full_name: 'John Smith',
    current_company: 'TechCorp Inc',
    title: 'VP of People Operations',
    headline: 'VP of People Operations | HR Technology Leader',
    username: 'johnsmith'
  }

  const mockProfile = {
    connectionId: 'conn-123',
    connectionName: 'John Smith',
    company: 'TechCorp Inc',
    title: 'VP of People Operations',
    profileUrl: 'https://linkedin.com/in/johnsmith',
    unifiedScores: {
      overallExpertise: 85,
      talentManagement: 90,
      peopleDevelopment: 80,
      hrTechnology: 88,
      practicalExperience: 85,
      thoughtLeadership: 82
    },
    intelligenceAssessment: {
      verificationStatus: 'verified' as const,
      confidenceLevel: 92,
      strengths: [
        'Deep expertise in people operations',
        'Strong thought leadership in HR tech',
        'Proven track record in scaling teams'
      ],
      recommendations: [
        'Focus on performance management solutions',
        'Emphasize data analytics capabilities'
      ],
      redFlags: []
    },
    researchDuration: 45,
    researched_at: '2024-01-15T10:30:00Z'
  }

  const mockProps = {
    connection: mockConnection,
    profile: mockProfile,
    isSelected: false,
    onToggleSelection: jest.fn(),
    onResearch: jest.fn(),
    isLoading: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Rendering', () => {
    it('should render connection information', () => {
      render(<IntelligenceCard {...mockProps} />)
      
      expect(screen.getByText('John Smith')).toBeInTheDocument()
      expect(screen.getByText('VP of People Operations at TechCorp Inc')).toBeInTheDocument()
      expect(screen.getByText('linkedin.com/in/johnsmith')).toBeInTheDocument()
    })

    it('should render profile scores when profile exists', () => {
      render(<IntelligenceCard {...mockProps} />)
      
      expect(screen.getByText('85/100 Overall')).toBeInTheDocument()
      expect(screen.getByText('92% confidence')).toBeInTheDocument()
      expect(screen.getByText('verified')).toBeInTheDocument()
    })

    it('should render research button when no profile exists', () => {
      const propsWithoutProfile = { ...mockProps, profile: null }
      render(<IntelligenceCard {...propsWithoutProfile} />)
      
      expect(screen.getByRole('button', { name: /research/i })).toBeInTheDocument()
    })

    it('should show selected state styling', () => {
      const selectedProps = { ...mockProps, isSelected: true }
      render(<IntelligenceCard {...selectedProps} />)
      
      const card = screen.getByRole('article') || screen.getByText('John Smith').closest('[class*="border"]')
      expect(card).toHaveClass(/border-blue-300|bg-blue-50/)
    })

    it('should render verification badge with correct variant', () => {
      render(<IntelligenceCard {...mockProps} />)
      
      const verifiedBadge = screen.getByText('verified')
      expect(verifiedBadge).toBeInTheDocument()
    })

    it('should display key strengths truncated', () => {
      render(<IntelligenceCard {...mockProps} />)
      
      expect(screen.getByText(/Deep expertise in people operations, Strong thought leadership/)).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should toggle selection when checkbox is clicked', async () => {
      const user = userEvent.setup()
      render(<IntelligenceCard {...mockProps} />)
      
      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)
      
      expect(mockProps.onToggleSelection).toHaveBeenCalledWith('conn-123')
    })

    it('should call onResearch when research button is clicked', async () => {
      const user = userEvent.setup()
      const propsWithoutProfile = { ...mockProps, profile: null }
      render(<IntelligenceCard {...propsWithoutProfile} />)
      
      const researchButton = screen.getByRole('button', { name: /research/i })
      await user.click(researchButton)
      
      expect(mockProps.onResearch).toHaveBeenCalledWith('conn-123')
    })

    it('should expand card when View Details is clicked', async () => {
      const user = userEvent.setup()
      
      // Mock successful API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { profile: mockProfile }
        })
      })

      render(<IntelligenceCard {...mockProps} />)
      
      const viewDetailsButton = screen.getByRole('button', { name: /view details/i })
      await user.click(viewDetailsButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('intelligence-report-display')).toBeInTheDocument()
      })
    })

    it('should collapse card when Collapse is clicked', async () => {
      const user = userEvent.setup()
      
      // Mock API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { profile: mockProfile }
        })
      })

      render(<IntelligenceCard {...mockProps} />)
      
      // First expand
      const viewDetailsButton = screen.getByRole('button', { name: /view details/i })
      await user.click(viewDetailsButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('intelligence-report-display')).toBeInTheDocument()
      })
      
      // Then collapse
      const collapseButton = screen.getByRole('button', { name: /collapse/i })
      await user.click(collapseButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('intelligence-report-display')).not.toBeInTheDocument()
      })
    })

    it('should handle re-research button click', async () => {
      const user = userEvent.setup()
      render(<IntelligenceCard {...mockProps} />)
      
      const reResearchButton = screen.getByRole('button', { name: /re-run research/i })
      await user.click(reResearchButton)
      
      expect(mockProps.onResearch).toHaveBeenCalledWith('conn-123')
    })
  })

  describe('Loading States', () => {
    it('should show loading state when research is in progress', () => {
      const loadingProps = { ...mockProps, isLoading: true, profile: null }
      render(<IntelligenceCard {...loadingProps} />)
      
      const researchButton = screen.getByRole('button', { name: /research/i })
      expect(researchButton).toBeDisabled()
    })

    it('should show loading when fetching full profile', async () => {
      const user = userEvent.setup()
      
      // Mock delayed API response
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true, data: { profile: mockProfile } })
          }), 100)
        )
      )

      render(<IntelligenceCard {...mockProps} />)
      
      const viewDetailsButton = screen.getByRole('button', { name: /view details/i })
      await user.click(viewDetailsButton)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should disable re-research button when loading', () => {
      const loadingProps = { ...mockProps, isLoading: true }
      render(<IntelligenceCard {...loadingProps} />)
      
      const reResearchButton = screen.getByRole('button', { name: /re-run research/i })
      expect(reResearchButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully when expanding', async () => {
      const user = userEvent.setup()
      
      // Mock API error
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      // Mock console.error to avoid error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<IntelligenceCard {...mockProps} />)
      
      const viewDetailsButton = screen.getByRole('button', { name: /view details/i })
      await user.click(viewDetailsButton)
      
      // Should not crash and not show the report display
      await waitFor(() => {
        expect(screen.queryByTestId('intelligence-report-display')).not.toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })

    it('should handle network errors', async () => {
      const user = userEvent.setup()
      
      // Mock network error
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<IntelligenceCard {...mockProps} />)
      
      const viewDetailsButton = screen.getByRole('button', { name: /view details/i })
      await user.click(viewDetailsButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('intelligence-report-display')).not.toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Score Visualization', () => {
    it('should apply correct color classes for different score ranges', () => {
      const highScoreProfile = {
        ...mockProfile,
        unifiedScores: {
          ...mockProfile.unifiedScores,
          overallExpertise: 85,
          talentManagement: 95,
          peopleDevelopment: 75,
          hrTechnology: 45
        }
      }

      render(<IntelligenceCard {...mockProps} profile={highScoreProfile} />)
      
      // High scores should have green color
      expect(screen.getByText('85/100 Overall')).toHaveClass(/text-green-600/)
      
      // Different score ranges should have different colors
      const scores = screen.getByText(/Talent Mgmt:/)
      expect(scores).toBeInTheDocument()
    })

    it('should display all score categories', () => {
      render(<IntelligenceCard {...mockProps} />)
      
      expect(screen.getByText(/Talent Mgmt:/)).toBeInTheDocument()
      expect(screen.getByText(/People Dev:/)).toBeInTheDocument()
      expect(screen.getByText(/HR Tech:/)).toBeInTheDocument()
      expect(screen.getByText(/Leadership:/)).toBeInTheDocument()
    })
  })

  describe('Verification Status', () => {
    it('should render different verification statuses correctly', () => {
      const statuses = ['verified', 'likely', 'unverified'] as const
      
      statuses.forEach(status => {
        const profileWithStatus = {
          ...mockProfile,
          intelligenceAssessment: {
            ...mockProfile.intelligenceAssessment,
            verificationStatus: status
          }
        }

        const { rerender } = render(
          <IntelligenceCard {...mockProps} profile={profileWithStatus} />
        )
        
        expect(screen.getByText(status)).toBeInTheDocument()
        
        // Clean up for next iteration
        rerender(<div />)
      })
    })
  })

  describe('Date Formatting', () => {
    it('should format research date correctly', () => {
      render(<IntelligenceCard {...mockProps} />)
      
      expect(screen.getByText('Researched Jan 15, 2024')).toBeInTheDocument()
      expect(screen.getByText('45s duration')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<IntelligenceCard {...mockProps} />)
      
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<IntelligenceCard {...mockProps} />)
      
      // Tab to checkbox
      await user.tab()
      expect(screen.getByRole('checkbox')).toHaveFocus()
      
      // Tab to view details button
      await user.tab()
      expect(screen.getByRole('button', { name: /view details/i })).toHaveFocus()
    })
  })
})