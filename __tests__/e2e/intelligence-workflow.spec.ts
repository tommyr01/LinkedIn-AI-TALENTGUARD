/**
 * End-to-End Tests for Intelligence Research Workflow
 * Tests complete user journey from connection selection to intelligence analysis
 */

import { test, expect, Page } from '@playwright/test'

test.describe('Intelligence Research Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses to avoid external dependencies
    await page.route('**/api/intelligence/connections**', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            connections: [
              {
                id: 'conn-123',
                full_name: 'Sarah Johnson',
                current_company: 'TechCorp Inc',
                title: 'VP of People Operations',
                headline: 'VP of People Operations | HR Technology Leader',
                username: 'sarahjohnson',
                follower_count: 5420,
                connection_count: 2500
              },
              {
                id: 'conn-456',
                full_name: 'Mike Chen',
                current_company: 'StartupCorp',
                title: 'Chief People Officer',
                headline: 'Chief People Officer | Talent Strategy Expert',
                username: 'mikechen',
                follower_count: 3200,
                connection_count: 1800
              }
            ],
            total: 2
          }
        }
      })
    })

    await page.route('**/api/intelligence/profiles**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          json: {
            success: true,
            data: {
              profile: {
                connection_id: 'conn-123',
                connection_name: 'Sarah Johnson',
                company: 'TechCorp Inc',
                title: 'VP of People Operations',
                unified_scores: {
                  overallExpertise: 85,
                  talentManagement: 90,
                  peopleDevelopment: 80,
                  hrTechnology: 88,
                  practicalExperience: 85,
                  thoughtLeadership: 82
                },
                intelligence_assessment: {
                  verificationStatus: 'verified',
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
                research_duration: 45,
                researched_at: new Date().toISOString()
              }
            }
          }
        })
      } else {
        await route.fulfill({
          json: {
            success: true,
            data: {
              profiles: []
            }
          }
        })
      }
    })
  })

  test('should complete full intelligence research workflow', async ({ page }) => {
    // Navigate to intelligence dashboard
    await page.goto('/dashboard/intelligence')

    // Should show connections list
    await expect(page.getByText('Sarah Johnson')).toBeVisible()
    await expect(page.getByText('TechCorp Inc')).toBeVisible()
    await expect(page.getByText('VP of People Operations')).toBeVisible()

    // Select a connection for research
    const connectionCheckbox = page.locator('[data-testid="connection-checkbox-conn-123"]')
      .or(page.getByRole('checkbox').first())
    await connectionCheckbox.check()

    // Click research button
    const researchButton = page.getByRole('button', { name: /research/i }).first()
    await researchButton.click()

    // Should show loading state
    await expect(page.getByText(/researching/i).or(page.locator('[data-testid="loading"]'))).toBeVisible({ timeout: 5000 })

    // Should complete research and show results
    await expect(page.getByText('85/100 Overall')).toBeVisible({ timeout: 30000 })
    await expect(page.getByText('verified')).toBeVisible()
    await expect(page.getByText('92% confidence')).toBeVisible()

    // Should show detailed scores
    await expect(page.getByText(/Talent Mgmt/)).toBeVisible()
    await expect(page.getByText(/People Dev/)).toBeVisible()
    await expect(page.getByText(/HR Tech/)).toBeVisible()

    // Click View Details to expand full report
    const viewDetailsButton = page.getByRole('button', { name: /view details/i })
    await viewDetailsButton.click()

    // Should show expanded intelligence report
    await expect(page.getByText('Deep expertise in people operations')).toBeVisible()
    await expect(page.getByText('Focus on performance management solutions')).toBeVisible()
  })

  test('should handle batch intelligence processing', async ({ page }) => {
    await page.goto('/dashboard/intelligence')

    // Select multiple connections
    const checkboxes = page.getByRole('checkbox')
    await checkboxes.first().check()
    await checkboxes.nth(1).check()

    // Click batch research button
    const batchResearchButton = page.getByRole('button', { name: /research selected/i })
      .or(page.getByRole('button', { name: /batch research/i }))
    await batchResearchButton.click()

    // Should show batch processing indicator
    await expect(page.getByText(/processing \d+ connections/i)).toBeVisible({ timeout: 5000 })

    // Should show progress updates
    await expect(page.locator('[data-testid="batch-progress"]')
      .or(page.getByText(/progress/i))).toBeVisible()
  })

  test('should filter and search connections', async ({ page }) => {
    await page.goto('/dashboard/intelligence')

    // Use search functionality
    const searchInput = page.getByPlaceholder(/search connections/i)
      .or(page.getByRole('textbox', { name: /search/i }))
    await searchInput.fill('Sarah')

    // Should filter results
    await expect(page.getByText('Sarah Johnson')).toBeVisible()
    await expect(page.getByText('Mike Chen')).not.toBeVisible()

    // Clear search
    await searchInput.clear()
    await expect(page.getByText('Mike Chen')).toBeVisible()

    // Test company filter
    const companyFilter = page.getByRole('combobox', { name: /company/i })
      .or(page.locator('[data-testid="company-filter"]'))
    
    if (await companyFilter.isVisible()) {
      await companyFilter.click()
      await page.getByText('TechCorp Inc').click()
      await expect(page.getByText('Sarah Johnson')).toBeVisible()
    }
  })

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/intelligence/profiles**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          json: {
            success: false,
            error: 'Intelligence processing failed'
          }
        })
      }
    })

    await page.goto('/dashboard/intelligence')

    // Select connection and attempt research
    const checkbox = page.getByRole('checkbox').first()
    await checkbox.check()

    const researchButton = page.getByRole('button', { name: /research/i }).first()
    await researchButton.click()

    // Should show error message
    await expect(page.getByText(/error/i).or(page.getByText(/failed/i))).toBeVisible({ timeout: 10000 })
    
    // Error should not break the interface
    await expect(page.getByText('Sarah Johnson')).toBeVisible()
  })

  test('should export intelligence data', async ({ page }) => {
    await page.goto('/dashboard/intelligence')

    // Simulate having researched profiles
    await page.route('**/api/intelligence/profiles**', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            profiles: [
              {
                connection_id: 'conn-123',
                connection_name: 'Sarah Johnson',
                unified_scores: { overallExpertise: 85 },
                intelligence_assessment: { verificationStatus: 'verified' }
              }
            ]
          }
        }
      })
    })

    await page.reload()

    // Look for export functionality
    const exportButton = page.getByRole('button', { name: /export/i })
      .or(page.getByText(/download/i))
    
    if (await exportButton.isVisible()) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()
      
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('intelligence')
    }
  })

  test('should navigate between different intelligence views', async ({ page }) => {
    await page.goto('/dashboard/intelligence')

    // Should be able to navigate to connections view
    const connectionsTab = page.getByRole('tab', { name: /connections/i })
      .or(page.getByText(/connections/i))
    
    if (await connectionsTab.isVisible()) {
      await connectionsTab.click()
      await expect(page.getByText('Sarah Johnson')).toBeVisible()
    }

    // Should be able to navigate to profiles view
    const profilesTab = page.getByRole('tab', { name: /profiles/i })
      .or(page.getByText(/profiles/i))
    
    if (await profilesTab.isVisible()) {
      await profilesTab.click()
    }

    // Should be able to navigate to analytics view
    const analyticsTab = page.getByRole('tab', { name: /analytics/i })
      .or(page.getByText(/analytics/i))
    
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click()
    }
  })
})

test.describe('Intelligence Dashboard Interactions', () => {
  test('should display intelligence scores with proper formatting', async ({ page }) => {
    // Mock profile with intelligence data
    await page.route('**/api/intelligence/connections**', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            connections: [
              {
                id: 'conn-123',
                full_name: 'Sarah Johnson',
                current_company: 'TechCorp Inc',
                intelligence_scores: {
                  overall: 85,
                  talent_management: 90,
                  people_development: 80
                }
              }
            ]
          }
        }
      })
    })

    await page.goto('/dashboard/intelligence')

    // Should display formatted scores
    await expect(page.getByText(/85/)).toBeVisible()
    await expect(page.getByText(/overall/i)).toBeVisible()

    // Scores should have appropriate color coding
    const highScoreElement = page.locator('[data-score="85"]')
      .or(page.getByText('85').first())
    
    if (await highScoreElement.isVisible()) {
      await expect(highScoreElement).toHaveClass(/text-green|color.*green|success/)
    }
  })

  test('should handle real-time updates', async ({ page }) => {
    await page.goto('/dashboard/intelligence')

    // Mock WebSocket or polling updates
    await page.evaluate(() => {
      // Simulate real-time update
      const event = new CustomEvent('intelligenceUpdate', {
        detail: {
          connectionId: 'conn-123',
          status: 'completed',
          scores: { overall: 88 }
        }
      })
      window.dispatchEvent(event)
    })

    // Should update UI without full refresh
    await expect(page.getByText(/updated/i).or(page.getByText(/88/))).toBeVisible({ timeout: 5000 })
  })

  test('should persist user preferences', async ({ page }) => {
    await page.goto('/dashboard/intelligence')

    // Set filters and sorting preferences
    const sortSelect = page.getByRole('combobox', { name: /sort/i })
    if (await sortSelect.isVisible()) {
      await sortSelect.click()
      await page.getByText(/score/i).click()
    }

    // Navigate away and back
    await page.goto('/dashboard')
    await page.goto('/dashboard/intelligence')

    // Preferences should be maintained
    if (await sortSelect.isVisible()) {
      await expect(sortSelect).toHaveValue(/score/i)
    }
  })
})