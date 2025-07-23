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

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: companies, isLoading, error } = useSWR('/api/accounts', fetcher)

  // Stats calculations
  const totalCompanies = companies?.length || 0
  const hotLeads = companies?.filter(c => c.Status === 'Hot Lead').length || 0
  const avgScore = companies?.reduce((acc, curr) => acc + (curr['TalentGuard Score'] || 0), 0) / (totalCompanies || 1) || 0
  const activeContacts = companies?.reduce((acc, curr) => acc + (curr['Buying Committee']?.length || 0), 0) || 0

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
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <IconBuilding className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-medium">Failed to load companies</h3>
              <p className="text-muted-foreground">
                {error.message || 'There was an error loading company data. Please try again.'}
              </p>
              <Button onClick={() => window.location.reload()} className="mt-2">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter companies based on search query
  const filteredCompanies = searchQuery 
    ? companies?.filter(c => 
        c['Company Name']?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c['Industry']?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c['Location']?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : companies || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your target company pipeline
          </p>
        </div>
        <Button>
          Add Company
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Companies</p>
                <p className="text-2xl font-bold">{totalCompanies}</p>
              </div>
              <IconBuilding className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hot Leads</p>
                <p className="text-2xl font-bold">{hotLeads}</p>
              </div>
              <IconTrendingUp className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Contacts</p>
                <p className="text-2xl font-bold">{activeContacts}</p>
              </div>
              <IconUsers className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">{Math.round(avgScore)}</p>
              </div>
              <IconTarget className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search companies..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <IconFilter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      <div className="space-y-4">
        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <IconBuilding className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No companies found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search query or filters' : 'Start by adding a company to your pipeline'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCompanies.map((company) => (
            <Card key={company.id}>
              <CardContent className="p-6">
                <div className="grid grid-cols-12 gap-6">
                  {/* Company Info */}
                  <div className="col-span-12 lg:col-span-5 flex items-start gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                      <IconBuilding className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold">{company['Company Name']}</h3>
                        <Badge variant={
                          company['Status'] === 'Hot Lead' ? 'destructive' :
                          company['Status'] === 'Active' ? 'default' :
                          'secondary'
                        }>
                          {company['Status'] || 'New'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{company['Industry'] || 'Unknown Industry'}</span>
                        <span>•</span>
                        <span>{company['Company Size'] || 'Unknown Size'} employees</span>
                        <span>•</span>
                        <span>{company['Location'] || 'Unknown Location'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <IconExternalLink className="h-4 w-4" />
                        <a href={company['Website']} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {company['Website'] || 'No website'}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Buying Committee */}
                  <div className="col-span-12 lg:col-span-4 space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Buying Committee ({company['Buying Committee']?.length || 0})
                    </div>
                    <div className="space-y-1">
                      {company['Buying Committee'] ? (
                        company['Buying Committee'].map((member, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="font-medium">{member.name}</span>
                              <span className="text-muted-foreground"> • {member.role}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {member.status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No committee members identified yet</p>
                      )}
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="col-span-12 lg:col-span-3 flex flex-col items-end justify-between">
                    <div className="text-right space-y-2">
                      <div>
                        <div className="text-2xl font-bold">{company['TalentGuard Score'] || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">TalentGuard Score</div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <IconTrendingUp className="h-4 w-4" />
                          <span>{company['Signals Count'] || 0} signals</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconClock className="h-4 w-4" />
                          <span>{company['Last Contact'] || 'Never'}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm">View Details</Button>
                  </div>
                </div>
                
                {/* Notes */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Latest: </span>
                    {company['Notes'] || 'No notes yet'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}