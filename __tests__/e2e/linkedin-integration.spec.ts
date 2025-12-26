/**
 * End-to-End Tests for LinkedIn Integration Workflow
 * Tests LinkedIn scraping, post analysis, and comment generation
 */

import { test, expect } from '@playwright/test'

test.describe('LinkedIn Integration Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock LinkedIn API responses
    await page.route('**/api/linkedin-scrape**', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            profile: {
              success: true,
              data: {
                basic_info: {
                  fullname: 'John Smith',
                  headline: 'VP of People Operations | HR Technology Leader',
                  public_identifier: 'johnsmith',
                  current_company: 'TechCorp Inc',
                  follower_count: 5420,
                  connection_count: 2500
                },
                experience: [{
                  title: 'VP of People Operations',
                  company: 'TechCorp Inc',
                  is_current: true,
                  duration: '2 years 3 months'
                }]
              }
            },
            posts: [
              {
                urn: 'urn:li:activity:123456',
                text: 'The future of HR is data-driven. Here are 5 key metrics every People leader should track...',
                url: 'https://linkedin.com/posts/johnsmith_hrtech-activity-123456',
                stats: {
                  total_reactions: 245,
                  comments: 32,
                  reposts: 18
                },
                posted_at: {
                  relative: '2 weeks ago',
                  date: '2024-01-15'
                }
              }
            ]
          }
        }
      })
    })

    await page.route('**/api/posts/comments**', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            comment: 'Great insights on HR metrics! Your emphasis on data-driven decision making aligns perfectly with current industry trends. Have you found any specific tools particularly effective for tracking employee engagement metrics?',
            tone: 'professional_engaging',
            confidence: 92
          }
        }
      })
    })

    await page.route('**/api/linkedin/posts/list**', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            posts: [
              {
                urn: 'post-123',
                text: 'Excited to share our latest performance management insights...',
                stats: { total_reactions: 156, comments: 24 },
                posted_at: { relative: '1 week ago' }
              }
            ],
            total: 1
          }
        }
      })
    })
  })

  test('should complete LinkedIn profile scraping workflow', async ({ page }) => {
    await page.goto('/dashboard/linkedin/prospects')

    // Should show LinkedIn URL input
    const urlInput = page.getByPlaceholder(/linkedin.*url/i)
      .or(page.getByRole('textbox', { name: /linkedin/i }))
    
    await expect(urlInput).toBeVisible()

    // Enter LinkedIn URL
    await urlInput.fill('https://www.linkedin.com/in/johnsmith')

    // Click scrape button
    const scrapeButton = page.getByRole('button', { name: /scrape|analyze/i })
    await scrapeButton.click()

    // Should show loading state
    await expect(page.getByText(/scraping|processing/i)).toBeVisible({ timeout: 5000 })

    // Should display scraped profile data
    await expect(page.getByText('John Smith')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('VP of People Operations')).toBeVisible()
    await expect(page.getByText('TechCorp Inc')).toBeVisible()
    await expect(page.getByText('5420')).toBeVisible() // Follower count

    // Should show posts if included
    await expect(page.getByText(/The future of HR is data-driven/)).toBeVisible()
  })

  test('should handle post analysis and comment generation', async ({ page }) => {
    await page.goto('/dashboard/linkedin/my-posts')

    // Should display posts table
    await expect(page.getByText(/Excited to share our latest/)).toBeVisible()

    // Click generate comment button
    const generateButton = page.getByRole('button', { name: /generate comment/i }).first()
    await generateButton.click()

    // Should show comment generation modal/form
    await expect(page.getByText(/generating comment|comment generation/i)).toBeVisible()

    // Should display generated comment
    await expect(page.getByText(/Great insights on HR metrics/)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/92.*confidence|confidence.*92/i)).toBeVisible()

    // Should allow editing generated comment
    const commentTextArea = page.getByRole('textbox', { name: /comment/i })
      .or(page.locator('textarea'))
    
    if (await commentTextArea.isVisible()) {
      await commentTextArea.click()
      await commentTextArea.fill('Edited comment: This is a great post about HR metrics!')
    }

    // Should allow copying comment
    const copyButton = page.getByRole('button', { name: /copy/i })
    if (await copyButton.isVisible()) {
      await copyButton.click()
      await expect(page.getByText(/copied/i)).toBeVisible({ timeout: 3000 })
    }
  })

  test('should manage LinkedIn connections sync', async ({ page }) => {
    // Mock connections API
    await page.route('**/api/connections/supabase/sync**', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            syncId: 'sync-123',
            status: 'completed',
            processed: 150,
            added: 12,
            updated: 8
          }
        }
      })
    })

    await page.goto('/dashboard/connections')

    // Click sync connections button
    const syncButton = page.getByRole('button', { name: /sync.*connections/i })
    await syncButton.click()

    // Should show sync progress
    await expect(page.getByText(/syncing|sync in progress/i)).toBeVisible()

    // Should show sync results
    await expect(page.getByText(/150.*processed|processed.*150/i)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/12.*added|added.*12/i)).toBeVisible()
    await expect(page.getByText(/8.*updated|updated.*8/i)).toBeVisible()
  })

  test('should handle LinkedIn post engagement tracking', async ({ page }) => {
    await page.goto('/dashboard/linkedin/my-posts')

    // Should display engagement metrics
    await expect(page.getByText(/156.*reactions|reactions.*156/)).toBeVisible()
    await expect(page.getByText(/24.*comments|comments.*24/)).toBeVisible()

    // Click on post for detailed view
    const postRow = page.getByText(/Excited to share our latest/).locator('..')
    await postRow.click()

    // Should open detailed post view
    await expect(page.getByText(/post details|engagement breakdown/i)).toBeVisible()

    // Should show engagement breakdown
    await expect(page.getByText(/likes|reactions/i)).toBeVisible()
    await expect(page.getByText(/shares|reposts/i)).toBeVisible()
  })

  test('should validate LinkedIn URLs', async ({ page }) => {
    await page.goto('/dashboard/linkedin/prospects')

    const urlInput = page.getByRole('textbox', { name: /linkedin/i })

    // Test invalid URLs
    const invalidUrls = [
      'not-a-url',
      'https://facebook.com/profile',
      'https://linkedin.com/company/invalid',
      ''
    ]

    for (const invalidUrl of invalidUrls) {
      await urlInput.fill(invalidUrl)
      
      const scrapeButton = page.getByRole('button', { name: /scrape/i })
      await scrapeButton.click()

      // Should show validation error
      await expect(page.getByText(/invalid.*url|please enter.*valid/i)).toBeVisible({ timeout: 3000 })
    }

    // Test valid URL
    await urlInput.fill('https://www.linkedin.com/in/validprofile')
    await scrapeButton.click()

    // Should not show validation error and proceed with scraping
    await expect(page.getByText(/scraping|processing/i)).toBeVisible()
  })

  test('should handle rate limiting and errors', async ({ page }) => {
    // Mock rate limit error
    await page.route('**/api/linkedin-scrape**', async route => {
      await route.fulfill({
        status: 429,
        json: {
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        }
      })
    })

    await page.goto('/dashboard/linkedin/prospects')

    const urlInput = page.getByRole('textbox', { name: /linkedin/i })
    await urlInput.fill('https://www.linkedin.com/in/testuser')

    const scrapeButton = page.getByRole('button', { name: /scrape/i })
    await scrapeButton.click()

    // Should show rate limit error message
    await expect(page.getByText(/rate limit|try again later/i)).toBeVisible({ timeout: 10000 })

    // Should suggest retry time
    await expect(page.getByText(/minutes|later/i)).toBeVisible()
  })

  test('should support bulk LinkedIn operations', async ({ page }) => {
    // Mock bulk operations API
    await page.route('**/api/linkedin/posts/sync**', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            syncId: 'bulk-sync-456',
            status: 'in_progress',
            total: 50,
            processed: 25
          }
        }
      })
    })

    await page.goto('/dashboard/linkedin/my-posts')

    // Select multiple posts
    const checkboxes = page.getByRole('checkbox')
    await checkboxes.first().check()
    await checkboxes.nth(1).check()

    // Click bulk action button
    const bulkButton = page.getByRole('button', { name: /bulk.*action|selected.*posts/i })
    if (await bulkButton.isVisible()) {
      await bulkButton.click()

      // Should show bulk operation menu
      await expect(page.getByText(/generate comments|analyze engagement/i)).toBeVisible()
    }
  })

  test('should integrate with CRM systems', async ({ page }) => {
    // Mock CRM sync API
    await page.route('**/api/salesforce-sync**', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            syncId: 'sf-sync-789',
            contacts_synced: 25,
            opportunities_updated: 8
          }
        }
      })
    })

    await page.goto('/dashboard/connections')

    // Look for CRM sync options
    const crmSyncButton = page.getByRole('button', { name: /sync.*salesforce|crm.*sync/i })
    
    if (await crmSyncButton.isVisible()) {
      await crmSyncButton.click()

      // Should show sync progress
      await expect(page.getByText(/syncing with|salesforce/i)).toBeVisible()

      // Should show sync results
      await expect(page.getByText(/25.*contacts|contacts.*25/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('should export LinkedIn data', async ({ page }) => {
    await page.goto('/dashboard/linkedin/my-posts')

    // Look for export functionality
    const exportButton = page.getByRole('button', { name: /export|download/i })
    
    if (await exportButton.isVisible()) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()

      // Should trigger download
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/linkedin.*posts|posts.*export/i)
    }
  })

  test('should handle LinkedIn authentication flows', async ({ page }) => {
    // Mock authentication check
    await page.route('**/api/linkedin/auth**', async route => {
      await route.fulfill({
        json: {
          success: false,
          error: 'LinkedIn authentication required',
          auth_url: 'https://linkedin.com/oauth/authorize'
        }
      })
    })

    await page.goto('/dashboard/linkedin/my-posts')

    // Should show authentication prompt
    await expect(page.getByText(/authenticate|connect.*linkedin/i)).toBeVisible()

    // Should provide authentication button
    const authButton = page.getByRole('button', { name: /connect.*linkedin|authenticate/i })
    if (await authButton.isVisible()) {
      await authButton.click()
      
      // Should handle OAuth flow (in real implementation)
      await expect(page.getByText(/redirecting|authorizing/i)).toBeVisible({ timeout: 5000 })
    }
  })
})