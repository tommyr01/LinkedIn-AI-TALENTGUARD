"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  IconBuilding, 
  IconUsers, 
  IconMapPin, 
  IconTrendingUp,
  IconSearch,
  IconFilter,
  IconExternalLink,
  IconStar,
  IconClock,
  IconTarget,
  IconLoader2
} from '@tabler/icons-react'
import useSWR from 'swr'

const fetcher = (url: string) => 
  fetch(url).then(async (res) => {
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  })

// Type definition for API company data
interface Company {
  id: string
  name: string
  domain: string
  industry: string
  isTgCustomer: boolean
  engagementScore: number
  lastSignalDate: string
  totalContacts: number
  recentSignalType: string[]
  engagementSummary: {
    state: string
    value: string
    isStale: boolean
  }
  industryInsights: {
    state: string
    value: string
    isStale: boolean
  }
}

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: companies, isLoading, error } = useSWR<Company[]>('/api/accounts', fetcher)

  // Stats calculations
  const totalCompanies = companies?.length || 0
  const customerCompanies = companies?.filter((c: Company) => c.isTgCustomer === true).length || 0
  const avgScore = (companies?.reduce((acc: number, curr: Company) => acc + (curr.engagementScore || 0), 0) || 0) / (totalCompanies || 1)
  const activeContacts = companies?.reduce((acc: number, curr: Company) => acc + (curr.totalContacts || 0), 0) || 0

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading companies...</p>
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <p className="text-destructive">Failed to load companies</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Filter companies based on search
  const filteredCompanies = companies?.filter((c: Company) => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.domain?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Track and manage your target accounts</p>
        </div>
        <Button>
          <IconBuilding className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <IconBuilding className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              In your database
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TG Customers</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Current customers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <IconStar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              TalentGuard score
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeContacts}</div>
            <p className="text-xs text-muted-foreground">
              Across all companies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search companies by name, industry, or location..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      <div className="space-y-4">
        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                No companies found matching your search.
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredCompanies.map((company: Company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-4">
                                  {/* Company Info */}
                  <div className="md:col-span-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          {company.name || 'Unnamed Company'}
                          {company.isTgCustomer && (
                            <Badge variant="default">
                              Customer
                            </Badge>
                          )}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{company.industry || 'Unknown Industry'}</span>
                          <span>•</span>
                          <span>{company.totalContacts || 0} contacts</span>
                        </div>
                        <div className="mt-2">
                          <a href={company.domain} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {company.domain || 'No website'}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Engagement Summary */}
                  <div className="md:col-span-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Engagement Summary
                    </p>
                    <div className="mt-1">
                      <p className="text-sm">
                        {company.engagementSummary?.value || 'No engagement data'}
                      </p>
                      {company.recentSignalType && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {company.recentSignalType.map((signal: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {signal}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="md:col-span-1 text-right">
                    <div className="text-2xl font-bold">{company.engagementScore || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Engagement Score</div>
                    {company.lastSignalDate && (
                      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                        <IconClock className="h-3 w-3" />
                        {company.lastSignalDate}
                      </div>
                    )}
                  </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </div>
  )
}