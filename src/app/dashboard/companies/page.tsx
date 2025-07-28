"use client"

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconSearch, IconClock, IconUsers, IconTrendingUp, IconExternalLink, IconTarget, IconBrain, IconBuilding, IconServer, IconDownload } from '@tabler/icons-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'

// Type definition for API company data based on actual Airtable structure
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
  signals: string[]
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
  tasks: string[]
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
})

// Industry color mapping
const industryColors = {
  'Technology': 'bg-blue-100 text-blue-800 border-blue-200',
  'Finance': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Healthcare': 'bg-teal-100 text-teal-800 border-teal-200',
  'Education': 'bg-green-100 text-green-800 border-green-200',
  'Retail': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Other': 'bg-orange-100 text-orange-800 border-orange-200'
}

// Engagement score color mapping
const getEngagementScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

// Signal type color mapping
const signalTypeColors = {
  'Funding': 'bg-green-100 text-green-700 border-green-200',
  'LinkedIn Post': 'bg-blue-100 text-blue-700 border-blue-200',
  'Website Visit': 'bg-purple-100 text-purple-700 border-purple-200',
  'Email Open': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Other': 'bg-gray-100 text-gray-700 border-gray-200'
}

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [salesforceCompany, setSalesforceCompany] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const { data: companies, isLoading, error, mutate } = useSWR<Company[]>('/api/accounts', fetcher)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  // Stats calculations
  const totalCompanies = companies?.length || 0
  const customerCompanies = companies?.filter((c: Company) => c.isTgCustomer === true).length || 0
  const avgScore = Math.round((companies?.reduce((acc: number, curr: Company) => acc + (curr.engagementScore || 0), 0) || 0) / (totalCompanies || 1))
  const activeContacts = companies?.reduce((acc: number, curr: Company) => acc + (curr.totalContacts || 0), 0) || 0

  // Filter companies based on search
  const filteredCompanies = companies?.filter((c: Company) => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.domain?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleSalesforceImport = async () => {
    if (!salesforceCompany.trim()) {
      toast({
        title: "Error",
        description: "Please enter a company name",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      // Call our API endpoint that will trigger the MCP server
      const response = await fetch('/api/salesforce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: salesforceCompany
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import data');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Added "${salesforceCompany}" to your companies list.`,
      });
      
      // Refresh the company list
      mutate();
      
      // Clear the input
      setSalesforceCompany('');
    } catch (error) {
      console.error('Error importing from Salesforce:', error);
      toast({
        title: "Import Failed",
        description: (error as Error).message || "Could not import data from Salesforce",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading companies...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Failed to load companies</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Companies</h1>
        <p className="text-muted-foreground">
          Monitor and manage your company prospects and customers
          </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <IconTarget className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Companies</p>
                <p className="text-2xl font-bold">{totalCompanies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <IconUsers className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">TG Customers</p>
                <p className="text-2xl font-bold">{customerCompanies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Avg Engagement Score</p>
                <p className={`text-2xl font-bold ${getEngagementScoreColor(avgScore)}`}>{avgScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <IconUsers className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Active Contacts</p>
                <p className="text-2xl font-bold">{activeContacts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salesforce Import */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-md">Pull Salesforce Company Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <IconServer className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Enter Salesforce company name..."
                value={salesforceCompany}
                onChange={(e) => setSalesforceCompany(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleSalesforceImport} 
              disabled={isImporting}
              className="whitespace-nowrap"
            >
              <IconDownload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
            placeholder="Search companies by name, industry, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
        </div>
      </div>

      {/* Company Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCompanies.length === 0 ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">No companies found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
            </div>
                  </div>
        ) : (
          filteredCompanies.map((company: Company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => { setSelectedCompany(company); setDialogOpen(true) }}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {company.name || 'Unnamed Company'}
                      {company.isTgCustomer && (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                          Customer
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="outline" 
                        className={industryColors[company.industry as keyof typeof industryColors] || industryColors.Other}
                      >
                        <IconBuilding className="h-3 w-3 mr-1" />
                        {company.industry || 'Unknown'}
                      </Badge>
                      {company.domain && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={() => window.open(company.domain, '_blank')}
                        >
                          <IconExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getEngagementScoreColor(company.engagementScore)}`}>
                      {company.engagementScore || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Engagement Score</div>
                  </div>
                  {/* no chevron, whole card triggers dialog */}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Company Stats */}
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <IconUsers className="h-4 w-4 text-muted-foreground" />
                    <span>{company.totalContacts || 0} contacts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconTarget className="h-4 w-4 text-muted-foreground" />
                    <span>{company.signals?.length || 0} signals</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconClock className="h-4 w-4 text-muted-foreground" />
                    <span>{company.tasks?.length || 0} tasks</span>
                  </div>
                </div>

                {/* Recent Signals */}
                {company.recentSignalType && company.recentSignalType.length > 0 && (
                        <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Recent Signals</p>
                    <div className="flex flex-wrap gap-1">
                      {company.recentSignalType.slice(0, 3).map((signal: string, idx: number) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className={`text-xs ${signalTypeColors[signal as keyof typeof signalTypeColors] || signalTypeColors.Other}`}
                        >
                          {signal}
                        </Badge>
                      ))}
                      {company.recentSignalType.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{company.recentSignalType.length - 3} more
                        </Badge>
                      )}
                      </div>
                  </div>
                )}

                {/* AI-Generated Engagement Summary */}
                {company.engagementSummary?.value && (
                    <div>
                    <div className="flex items-center gap-1 mb-2">
                      <IconBrain className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">Engagement Summary</p>
                    </div>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-md">
                      {company.engagementSummary.value}
                    </p>
                      </div>
                )}

                {/* AI-Generated Industry Insights */}
                {company.industryInsights?.value && (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <IconTrendingUp className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">Industry Insights</p>
                    </div>
                    <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded-md">
                      {company.industryInsights.value}
                    </p>
                  </div>
                )}

                {/* Last Signal Date */}
                {company.lastSignalDate && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <IconClock className="h-3 w-3" />
                      Last signal: {company.lastSignalDate}
                </div>
              </div>
                )}

                {/* No inline research now */}
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Company Research Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedCompany && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedCompany.name}</DialogTitle>
            </DialogHeader>
            <CompanyResearch companyId={selectedCompany.id} />
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

function CompanyResearch({ companyId }: { companyId: string }) {
  const { data, isLoading, error } = useSWR(`/api/research?account=${companyId}`, fetcher)

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading research…</p>
  if (error) return <p className="text-sm text-red-600">Failed to load research</p>
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground">No research yet.</p>

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {data.map((r: any) => (
        <div key={r.id} className="space-y-1 border rounded-md p-3">
          <p className="font-semibold text-base">{r.title}</p>
          <p className="text-sm whitespace-pre-line text-muted-foreground">{r.summary}</p>
          {r.createdDate && <p className="text-xs text-muted-foreground">Created: {r.createdDate}</p>}
        </div>
      ))}
    </div>
  )
}