"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  IconSearch, 
  IconBuilding, 
  IconUsers, 
  IconMapPin, 
  IconBriefcase,
  IconFilter,
  IconDownload,
  IconPlus
} from '@tabler/icons-react'
import { toast } from '@/components/ui/use-toast'

export default function CompanySearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [industryQuery, setIndustryQuery] = useState('')
  const [sizeQuery, setSizeQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    
    try {
      // Create a new company record in Airtable
      if (searchQuery.trim()) {
        const response = await fetch('/api/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: searchQuery,
            domain: `${searchQuery.toLowerCase().replace(/\s+/g, '')}.com`,
            industry: industryQuery || 'Unknown',
            isTgCustomer: false,
            engagementScore: 0
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create company record');
        }

        const data = await response.json();
        console.log('Created company record:', data);
        
        toast({
          title: "Company Added",
          description: `Added "${searchQuery}" to your Airtable database`,
        });
      }

      // Simulate API call for UI display
    setTimeout(() => {
      setResults([
        {
          id: 1,
            name: searchQuery || "TechCorp Inc.",
            industry: industryQuery || "Technology",
            size: sizeQuery || "500-1000",
            location: locationQuery || "San Francisco, CA",
          description: "Leading technology company specializing in cloud solutions",
          buyingCommittee: 8,
          talentScore: 92
        },
        {
          id: 2,
          name: "FinanceFlow",
          industry: "Financial Services",
          size: "1000+",
          location: "New York, NY",
          description: "Innovative financial services and banking solutions",
          buyingCommittee: 12,
          talentScore: 88
        },
        {
          id: 3,
          name: "HealthTech Solutions",
          industry: "Healthcare",
          size: "200-500",
          location: "Boston, MA",
          description: "Healthcare technology and patient management systems",
          buyingCommittee: 6,
          talentScore: 85
        }
      ])
      setLoading(false)
    }, 1000)
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: "Error",
        description: "Failed to add company to Airtable",
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company Search</h1>
          <p className="text-muted-foreground mt-1">
            Find and analyze target companies with AI-powered insights
          </p>
        </div>
        <Button>
          <IconDownload className="h-4 w-4 mr-2" />
          Export Results
        </Button>
      </div>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Search Parameters</CardTitle>
          <CardDescription>
            Enter company details or use filters to find your ideal prospects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyNameInput">Company Name</Label>
              <Input
                id="companyNameInput"
                placeholder="Enter company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g., Technology, Healthcare..."
                value={industryQuery}
                onChange={(e) => setIndustryQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Company Size</Label>
              <Input
                id="size"
                placeholder="e.g., 100-500, 1000+"
                value={sizeQuery}
                onChange={(e) => setSizeQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, State or Country"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button id="searchCompaniesButton" onClick={handleSearch} disabled={loading}>
              <IconSearch className="h-4 w-4 mr-2" />
              {loading ? 'Searching...' : 'Search Companies'}
            </Button>
            <Button variant="outline">
              <IconFilter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Search Results ({results.length})</h2>
          {results.map((company) => (
            <Card key={company.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <IconBuilding className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">{company.name}</h3>
                      <Badge variant="outline">{company.industry}</Badge>
                    </div>
                    
                    <p className="text-muted-foreground">{company.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <IconUsers className="h-4 w-4" />
                        <span>{company.size} employees</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconMapPin className="h-4 w-4" />
                        <span>{company.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconBriefcase className="h-4 w-4" />
                        <span>{company.buyingCommittee} decision makers</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center ml-4">
                    <div className="text-2xl font-bold">{company.talentScore}</div>
                    <div className="text-xs text-muted-foreground">TalentGuard Score</div>
                    <Button size="sm" className="mt-2">
                      <IconPlus className="h-4 w-4 mr-1" />
                      Add to Pipeline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <IconSearch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No companies found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search parameters or use different filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}