import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToneProfileManagerV2 } from '@/components/tone-profile/tone-profile-manager-v2'
import { useToneProfiles } from '@/hooks/use-tone-profiles'

// Mock the custom hook
jest.mock('@/hooks/use-tone-profiles')
const mockUseToneProfiles = useToneProfiles as jest.MockedFunction<typeof useToneProfiles>

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/dashboard/settings',
}))

const mockProfiles = [
  {
    id: '1',
    name: 'Professional',
    description: 'Professional tone for business communications',
    formality_level: 'professional' as const,
    communication_style: 'collaborative' as const,
    personality_traits: ['analytical', 'supportive'],
    industry_language: 'hr_tech',
    custom_elements: '',
    sample_phrases: ['Thank you for your time'],
    avoid_words: ['urgent'],
    preferred_greetings: ['Good morning'],
    preferred_closings: ['Best regards'],
    ai_temperature: 0.7,
    ai_max_tokens: 1000,
    ai_model: 'gpt-4',
    usage_count: 15,
    effectiveness_score: 85,
    last_used_at: '2024-01-15T10:00:00Z',
    is_active: true,
    is_default: true,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Casual',
    description: 'Casual tone for informal communications',
    formality_level: 'casual' as const,
    communication_style: 'direct' as const,
    personality_traits: ['enthusiastic'],
    industry_language: 'general',
    custom_elements: '',
    sample_phrases: ['Hey there'],
    avoid_words: [],
    preferred_greetings: ['Hi'],
    preferred_closings: ['Thanks'],
    ai_temperature: 0.8,
    ai_max_tokens: 800,
    ai_model: 'gpt-3.5-turbo',
    usage_count: 5,
    effectiveness_score: 72,
    is_active: true,
    is_default: false,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  }
]

const mockActions = {
  loadProfiles: jest.fn(),
  loadTemplates: jest.fn(),
  createProfile: jest.fn(),
  updateProfile: jest.fn(),
  setDefaultProfile: jest.fn(),
  duplicateProfile: jest.fn(),
  deleteProfile: jest.fn(),
  createFromTemplate: jest.fn(),
}

const defaultMockReturn = {
  profiles: mockProfiles,
  templates: [],
  loading: false,
  submitting: false,
  defaultFormData: {
    name: '',
    description: '',
    formality_level: 'professional' as const,
    communication_style: 'collaborative' as const,
    personality_traits: [],
    industry_language: 'general',
    custom_elements: '',
    sample_phrases: [''],
    avoid_words: [''],
    preferred_greetings: [''],
    preferred_closings: [''],
    ai_temperature: 0.7,
    ai_max_tokens: 1000,
    ai_model: 'gpt-4',
    is_default: false,
  },
  actions: mockActions,
}

describe('ToneProfileManagerV2', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseToneProfiles.mockReturnValue(defaultMockReturn)
  })

  it('renders correctly with profiles', () => {
    render(<ToneProfileManagerV2 />)
    
    expect(screen.getByText('Tone of Voice Settings')).toBeInTheDocument()
    expect(screen.getByText('Professional')).toBeInTheDocument()
    expect(screen.getByText('Casual')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create profile/i })).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseToneProfiles.mockReturnValue({
      ...defaultMockReturn,
      loading: true,
    })

    render(<ToneProfileManagerV2 />)
    
    expect(screen.getByText('Loading tone profiles...')).toBeInTheDocument()
  })

  it('shows empty state when no profiles exist', () => {
    mockUseToneProfiles.mockReturnValue({
      ...defaultMockReturn,
      profiles: [],
    })

    render(<ToneProfileManagerV2 />)
    
    expect(screen.getByText('No Tone Profiles Yet')).toBeInTheDocument()
    expect(screen.getByText('Create Your First Profile')).toBeInTheDocument()
  })

  it('opens create form when create button is clicked', async () => {
    const user = userEvent.setup()
    render(<ToneProfileManagerV2 />)
    
    const createButton = screen.getByRole('button', { name: /create profile/i })
    await user.click(createButton)
    
    expect(screen.getByText('Create New Tone Profile')).toBeInTheDocument()
  })

  it('can edit a profile', async () => {
    const user = userEvent.setup()
    render(<ToneProfileManagerV2 />)
    
    const editButtons = screen.getAllByLabelText('Edit profile')
    await user.click(editButtons[0])
    
    expect(screen.getByText('Edit Tone Profile')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Professional')).toBeInTheDocument()
  })

  it('calls setDefaultProfile when setting profile as default', async () => {
    const user = userEvent.setup()
    render(<ToneProfileManagerV2 />)
    
    const defaultButton = screen.getByLabelText('Set as default profile')
    await user.click(defaultButton)
    
    expect(mockActions.setDefaultProfile).toHaveBeenCalledWith('2')
  })

  it('calls duplicateProfile when duplicating a profile', async () => {
    const user = userEvent.setup()
    render(<ToneProfileManagerV2 />)
    
    const duplicateButtons = screen.getAllByLabelText('Duplicate profile')
    await user.click(duplicateButtons[0])
    
    expect(mockActions.duplicateProfile).toHaveBeenCalledWith('1')
  })

  it('shows templates when templates button is clicked', async () => {
    const user = userEvent.setup()
    mockUseToneProfiles.mockReturnValue({
      ...defaultMockReturn,
      templates: [
        {
          id: 't1',
          name: 'Sales Professional',
          category: 'sales',
          description: 'Template for sales communications',
          formality_level: 'professional',
          communication_style: 'consultative',
          personality_traits: ['persuasive', 'empathetic'],
          industry_language: 'sales',
          sample_phrases: [],
          is_premium: false,
          usage_count: 100,
          popularity_score: 85,
        }
      ],
    })

    render(<ToneProfileManagerV2 />)
    
    const templatesButton = screen.getByRole('button', { name: /templates/i })
    await user.click(templatesButton)
    
    expect(screen.getByText('Tone Profile Templates')).toBeInTheDocument()
    expect(screen.getByText('Sales Professional')).toBeInTheDocument()
  })

  it('handles form submission correctly', async () => {
    const user = userEvent.setup()
    mockActions.createProfile.mockResolvedValue(true)
    
    render(<ToneProfileManagerV2 />)
    
    // Open create form
    const createButton = screen.getByRole('button', { name: /create profile/i })
    await user.click(createButton)
    
    // Fill form
    const nameInput = screen.getByLabelText('Profile Name')
    await user.type(nameInput, 'Test Profile')
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create profile/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockActions.createProfile).toHaveBeenCalled()
    })
  })

  it('handles accessibility correctly', () => {
    render(<ToneProfileManagerV2 />)
    
    // Check for ARIA labels
    expect(screen.getByLabelText('Set as default profile')).toBeInTheDocument()
    expect(screen.getByLabelText('Edit profile')).toBeInTheDocument()
    expect(screen.getByLabelText('Delete profile')).toBeInTheDocument()
    
    // Check for proper headings
    expect(screen.getByRole('heading', { name: 'Tone of Voice Settings' })).toBeInTheDocument()
  })

  it('displays profile information correctly', () => {
    render(<ToneProfileManagerV2 />)
    
    // Check profile details
    expect(screen.getByText('Professional')).toBeInTheDocument()
    expect(screen.getByText('Professional tone for business communications')).toBeInTheDocument()
    expect(screen.getByText('analytical')).toBeInTheDocument()
    expect(screen.getByText('supportive')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument() // usage count
  })

  it('handles error states gracefully', async () => {
    const user = userEvent.setup()
    mockActions.createProfile.mockResolvedValue(false)
    
    render(<ToneProfileManagerV2 />)
    
    // Open form and submit
    const createButton = screen.getByRole('button', { name: /create profile/i })
    await user.click(createButton)
    
    const nameInput = screen.getByLabelText('Profile Name')
    await user.type(nameInput, 'Test Profile')
    
    const submitButton = screen.getByRole('button', { name: /create profile/i })
    await user.click(submitButton)
    
    // Form should remain open since creation failed
    await waitFor(() => {
      expect(screen.getByText('Create New Tone Profile')).toBeInTheDocument()
    })
  })
})