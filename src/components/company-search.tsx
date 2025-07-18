"use client"

import { useState } from "react"
import { Search, Filter, Building2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function CompanySearch() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState([])

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/company-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setCompanies(result.data.companies)
      } else {
        console.error('Search failed:', result.error)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      {/* Modern Search Bar */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Search className="h-4 w-4 text-white" />
            </div>
            Company Search
          </CardTitle>
          <p className="text-sm text-gray-600">
            Find companies and identify their buying committee members
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search companies by name or domain..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 h-12 rounded-lg border-0 bg-white shadow-sm"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-lg"
            >
              {loading ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-lg border-0 shadow-sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modern Loading Results */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search Results */}
      {companies.length > 0 && (
        <div className="space-y-4">
          {companies.map((company: any) => (
            <Card key={company.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold text-gray-900">{company.name}</h3>
                        <p className="text-gray-600">{company.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{company.industry}</span>
                          <span>•</span>
                          <span>{company.size} employees</span>
                          <span>•</span>
                          <span>{company.location}</span>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                            {company.buyingSignals.score} Score
                          </Badge>
                        </div>
                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                          View Details
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Buying Signals:</p>
                      <div className="flex flex-wrap gap-2">
                        {company.buyingSignals.signals.slice(0, 2).map((signal: string, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700">
                            {signal}
                          </Badge>
                        ))}
                        {company.buyingSignals.signals.length > 2 && (
                          <Badge variant="secondary" className="bg-gray-50 text-gray-700">
                            +{company.buyingSignals.signals.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Key Contacts:</p>
                      <div className="flex gap-2">
                        {company.keyContacts.map((contact: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {contact.name.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                              <p className="text-xs text-gray-600">{contact.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modern Empty State */}
      {companies.length === 0 && !loading && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                <Building2 className="h-10 w-10 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Start Your Search
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Search for companies to find and analyze their buying committee members with AI-powered insights
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-4">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  500+ employees
                </Badge>
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  Technology
                </Badge>
                <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                  HR Tech
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}