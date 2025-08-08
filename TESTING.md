# TalentGuard Buyer Intelligence - Testing Documentation

## Overview

This document provides comprehensive testing procedures, maintenance guidelines, and best practices for the TalentGuard Buyer Intelligence platform. Our testing framework ensures reliability across 30+ API endpoints, complex AI processing workflows, and sophisticated React components.

## Testing Architecture

### Framework Stack
- **Unit/Integration Tests**: Jest + Testing Library
- **API Tests**: Supertest + Jest
- **End-to-End Tests**: Playwright
- **Test Environment**: Node.js with TypeScript
- **Mocking**: MSW (Mock Service Worker) + Custom mocks

### Coverage Targets
- **Overall**: 70% minimum
- **Critical Business Logic**: 90% minimum
- **API Routes**: 85% minimum
- **React Components**: 80% minimum

## Test Structure

```
__tests__/
├── setup.ts                 # Global test configuration
├── mocks/                   # Mock services and test data
│   ├── openai.mock.ts      # AI service mocks
│   ├── linkedin.mock.ts    # LinkedIn API mocks
│   ├── supabase.mock.ts    # Database mocks
│   ├── redis.mock.ts       # Queue system mocks
│   └── web-research.mock.ts # Research service mocks
├── unit/                   # Isolated function/class tests
├── integration/            # Component interaction tests
├── api/                    # API endpoint tests
├── components/             # React component tests
└── e2e/                    # End-to-end workflow tests
```

## Running Tests

### Quick Start
```bash
# Install dependencies
npm install

# Run all tests
npm run test

# Run with coverage report
npm run test:coverage

# Run in watch mode (development)
npm run test:watch
```

### Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# API endpoint tests
npm run test:api

# React component tests
npm run test:components

# End-to-end tests
npm run test:e2e

# E2E tests with UI mode
npm run test:e2e:ui

# Complete test suite
npm run test:all
```

## Test Categories Detailed

### 1. Unit Tests (`__tests__/unit/`)

**Purpose**: Test individual functions and classes in isolation.

**Key Test Files**:
- `intelligence-processor.test.ts` - AI processing logic
- `icp-scorer.test.ts` - TalentGuard scoring algorithms
- `linkedin-scraper.test.ts` - LinkedIn data processing
- `queue-manager.test.ts` - Job queue operations

**Example Test Structure**:
```typescript
describe('IntelligenceProcessor', () => {
  beforeEach(() => {
    // Setup mocks and test data
  })

  describe('processCustomerData', () => {
    it('should extract insights from meetings', async () => {
      // Test specific functionality
    })
  })
})
```

### 2. Integration Tests (`__tests__/integration/`)

**Purpose**: Test component interactions and database operations.

**Key Areas**:
- Queue processing workflows
- Database operations with Supabase
- External API integrations
- Worker process coordination

### 3. API Tests (`__tests__/api/`)

**Purpose**: Test all REST API endpoints.

**Coverage**:
- Intelligence processing endpoints (`/api/intelligence/*`)
- LinkedIn scraping (`/api/linkedin-scrape`)
- Job queue management (`/api/jobs/*`)
- Connection management (`/api/connections/*`)

**Example API Test**:
```typescript
describe('/api/intelligence/connections', () => {
  it('should return LinkedIn connections successfully', async () => {
    const response = await request(app)
      .get('/api/intelligence/connections?limit=50')
      .expect(200)
    
    expect(response.body.success).toBe(true)
    expect(response.body.data.connections).toBeInstanceOf(Array)
  })
})
```

### 4. Component Tests (`__tests__/components/`)

**Purpose**: Test React component rendering and interactions.

**Key Components**:
- `IntelligenceCard` - Connection intelligence display
- `LinkedInPostsTable` - Post analysis interface
- `CompanySearch` - Search functionality
- `IntelligenceReportDisplay` - Detailed reports

### 5. End-to-End Tests (`__tests__/e2e/`)

**Purpose**: Test complete user workflows in browser environment.

**Key Workflows**:
- Intelligence research pipeline
- LinkedIn integration flows
- Dashboard navigation
- Data export processes

## Mock Services

### External API Mocks

Our comprehensive mocking strategy ensures tests run reliably without external dependencies:

#### OpenAI Mock (`openai.mock.ts`)
- Simulates AI processing responses
- Provides predictable intelligence analysis
- Supports different response scenarios

#### LinkedIn Mock (`linkedin.mock.ts`)
- Realistic profile and post data
- Rate limiting simulation
- Error condition testing

#### Supabase Mock (`supabase.mock.ts`)
- Database operation simulation
- Realistic data responses
- Error handling scenarios

#### Redis Mock (`redis.mock.ts`)
- Queue operation mocking
- Job processing simulation
- Performance testing support

### Mock Data Standards

All mock data follows production data structures:

```typescript
// Example: LinkedIn Profile Mock
export const mockLinkedInProfile = {
  success: true,
  data: {
    basic_info: {
      fullname: 'John Smith',
      headline: 'VP of People Operations | HR Technology Leader',
      // ... complete realistic profile data
    }
  }
}
```

## Test Environment Setup

### Environment Variables
```bash
NODE_ENV=test
NEXTAUTH_SECRET=test-secret
NEXTAUTH_URL=http://localhost:3000
RAPIDAPI_KEY=test-key-12345
OPENAI_API_KEY=test-openai-key
```

### Database Setup
Tests use mocked Supabase client to avoid database dependencies:

```typescript
// Automatic mock loading
import '@/test/mocks/supabase.mock'

// Mock provides realistic responses
const connections = await supabaseLinkedIn.getConnections(50)
expect(connections).toBeInstanceOf(Array)
```

### External Service Mocking
All external services are mocked by default:
- OpenAI API calls return predictable responses
- LinkedIn scraping returns test profile data
- Perplexity research provides mock insights
- Redis operations simulate queue behavior

## Performance Testing

### Load Testing Guidelines

```typescript
// Example: High-volume job processing test
it('should handle high job volumes', async () => {
  const jobs = []
  
  // Add 100 jobs quickly
  for (let i = 0; i < 100; i++) {
    jobs.push(QueueManager.addResearchJob({
      companyId: `load-test-${i}`,
      companyName: `LoadTestCorp ${i}`
    }))
  }

  const startTime = Date.now()
  await Promise.all(jobs)
  const endTime = Date.now()

  expect(endTime - startTime).toBeLessThan(5000)
})
```

### Memory Usage Testing
Monitor memory consumption during test execution:

```bash
# Run tests with memory monitoring
node --expose-gc --inspect node_modules/.bin/jest --runInBand
```

## Error Testing Strategies

### 1. API Error Simulation
```typescript
// Mock API failures
mockOpenAI.chat.completions.create.mockRejectedValueOnce(
  new Error('API rate limit exceeded')
)
```

### 2. Network Error Testing
```typescript
// Simulate network failures
global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
```

### 3. Data Validation Testing
```typescript
// Test with malformed data
const invalidProfile = { basic_info: null }
expect(() => processProfile(invalidProfile)).not.toThrow()
```

## Continuous Integration

### GitHub Actions Pipeline
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:all
      - run: npm run test:coverage
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit && npm run test:components",
      "pre-push": "npm run test:all"
    }
  }
}
```

## Debugging Tests

### Jest Debugging
```bash
# Run specific test file
npm test -- intelligence-processor.test.ts

# Run with verbose output
npm test -- --verbose

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Debugging
```bash
# Run with headed browser
npm run test:e2e -- --headed

# Debug mode with browser dev tools
npm run test:e2e -- --debug

# Record test sessions
npm run test:e2e -- --record-video
```

### Common Debug Scenarios

1. **Mock Not Working**: Verify mock imports are before component imports
2. **Async Test Failures**: Ensure proper async/await usage
3. **Component Not Rendering**: Check for missing providers or context
4. **API Test Timeouts**: Increase timeout for complex operations

## Test Data Management

### Test Data Generation
```typescript
// Factory functions for consistent test data
export const createMockConnection = (overrides = {}) => ({
  id: 'conn-123',
  full_name: 'John Smith',
  current_company: 'TechCorp Inc',
  ...overrides
})
```

### Data Cleanup
```typescript
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks()
  
  // Reset module registry
  jest.resetModules()
})
```

## Accessibility Testing

### Component Accessibility
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('should have no accessibility violations', async () => {
  const { container } = render(<IntelligenceCard {...props} />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Keyboard Navigation Testing
```typescript
it('should be keyboard navigable', async () => {
  const user = userEvent.setup()
  render(<LinkedInPostsTable {...props} />)
  
  await user.tab()
  expect(screen.getByRole('button')).toHaveFocus()
})
```

## Performance Benchmarks

### Target Performance Metrics
- **API Response Time**: < 2 seconds average
- **Component Render Time**: < 100ms
- **Queue Processing**: 50+ jobs/minute
- **Intelligence Analysis**: < 30 seconds per profile

### Performance Test Examples
```typescript
it('should complete intelligence analysis within time limit', async () => {
  const startTime = Date.now()
  
  await processor.processCustomerData(mockData)
  
  const endTime = Date.now()
  expect(endTime - startTime).toBeLessThan(30000)
})
```

## Security Testing

### Input Validation Testing
```typescript
it('should sanitize LinkedIn URLs', async () => {
  const maliciousUrl = 'https://linkedin.com/in/user"><script>alert("xss")</script>'
  
  const response = await request(app)
    .post('/api/linkedin-scrape')
    .send({ linkedinUrl: maliciousUrl })
    .expect(400)
    
  expect(response.body.error).toBe('Invalid LinkedIn URL format')
})
```

### Authentication Testing
```typescript
it('should require valid authentication', async () => {
  const response = await request(app)
    .get('/api/intelligence/connections')
    .expect(401)
})
```

## Maintenance Procedures

### Weekly Maintenance
1. **Review Test Coverage**: Ensure coverage targets are met
2. **Update Mock Data**: Keep test data current with production
3. **Performance Review**: Check for test performance degradation
4. **Dependency Updates**: Update testing dependencies

### Monthly Maintenance
1. **Mock Service Updates**: Align mocks with external API changes
2. **Test Data Refresh**: Update realistic test datasets
3. **Performance Benchmarking**: Compare against baseline metrics
4. **Documentation Updates**: Keep testing docs current

### Quarterly Maintenance
1. **Testing Strategy Review**: Evaluate testing approach effectiveness
2. **Tool Evaluation**: Assess new testing tools and frameworks
3. **Test Suite Optimization**: Remove redundant tests, add gap coverage
4. **Training Updates**: Update team on testing best practices

## Troubleshooting

### Common Issues

#### 1. Tests Failing After Dependency Updates
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

#### 2. Mock Import Issues
```typescript
// Ensure mocks are imported before components
import '@/test/mocks/openai.mock'  // ✅ Before
import { IntelligenceProcessor } from '@/lib/intelligence-processor'  // ✅ After
```

#### 3. Async Test Timeouts
```typescript
// Increase timeout for complex operations
jest.setTimeout(30000)

// Or per test
it('should process intelligence', async () => {
  // test implementation
}, 30000)
```

#### 4. Component Test Rendering Issues
```typescript
// Wrap with necessary providers
const renderWithProviders = (component) => {
  return render(
    <Provider store={store}>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </Provider>
  )
}
```

## Best Practices

### 1. Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names that explain expected behavior
- Follow AAA pattern: Arrange, Act, Assert

### 2. Mock Management
- Use realistic mock data that matches production
- Mock external dependencies at module level
- Clear mocks between tests to avoid interference

### 3. Error Testing
- Test both success and failure scenarios
- Verify graceful error handling
- Test edge cases and boundary conditions

### 4. Performance Considerations
- Set appropriate timeouts for async operations
- Use `beforeEach`/`afterEach` for setup/teardown
- Avoid heavy operations in test setup

### 5. Maintainability
- Keep tests simple and focused
- Use test utilities for common operations
- Document complex test scenarios

## Metrics and Reporting

### Coverage Reports
```bash
# Generate detailed coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### Test Result Analysis
- **Pass Rate**: Target 95%+ test pass rate
- **Coverage Metrics**: Track by component and feature area
- **Performance Trends**: Monitor test execution time
- **Flaky Test Detection**: Identify and fix unstable tests

## Integration with Development Workflow

### Pre-Development
1. Write tests for new features (TDD approach)
2. Review existing test coverage for related functionality
3. Plan mock updates for external service changes

### During Development
1. Run relevant test suites frequently
2. Update tests as implementation changes
3. Add tests for new edge cases discovered

### Pre-Deployment
1. Run complete test suite
2. Verify coverage targets are met
3. Review performance impact of changes
4. Update integration tests for API changes

## Conclusion

This comprehensive testing framework ensures the reliability and maintainability of the TalentGuard Buyer Intelligence platform. Regular adherence to these testing practices will help maintain high code quality and system reliability as the platform continues to evolve.

For questions or clarifications about testing procedures, please refer to this documentation or reach out to the development team.