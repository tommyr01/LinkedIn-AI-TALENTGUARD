"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  IconUsers,
  IconUser,
  IconMail, 
  IconPhone, 
  IconBriefcase,
  IconBuildingSkyscraper,
  IconSearch,
  IconFilter,
  IconMapPin,
  IconBrandLinkedin,
  IconTrendingUp,
  IconLoader2
} from '@tabler/icons-react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: contacts, isLoading, error } = useSWR('/api/contacts', fetcher)

  // Stats calculations
  const totalContacts = contacts?.length || 0
  const highValueContacts = contacts?.filter(c => (c['TalentGuard Score'] || 0) > 80).length || 0
  const buyingCommitteeMembers = contacts?.filter(c => c['Role'] === 'Champion' || c['Role'] === 'Decision Maker').length || 0
  const avgScore = contacts?.reduce((acc, curr) => acc + (curr['TalentGuard Score'] || 0), 0) / (totalContacts || 1) || 0

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading contacts...</p>
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
              <IconUsers className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-medium">Failed to load contacts</h3>
              <p className="text-muted-foreground">
                {error.message || 'There was an error loading contact data. Please try again.'}
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

  // Filter contacts based on search query
  const filteredContacts = searchQuery 
    ? contacts?.filter(c => 
        c['Full Name']?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c['Job Title']?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c['Company Name']?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c['Email']?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : contacts || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track buying committee members
          </p>
        </div>
        <Button>
          Add Contact
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{totalContacts}</p>
              </div>
              <IconUsers className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Value</p>
                <p className="text-2xl font-bold">{highValueContacts}</p>
              </div>
              <IconTrendingUp className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Buying Committee</p>
                <p className="text-2xl font-bold">{buyingCommitteeMembers}</p>
              </div>
              <IconBriefcase className="h-8 w-8 text-muted-foreground" />
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
              <IconTrendingUp className="h-8 w-8 text-muted-foreground" />
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
                placeholder="Search contacts..."
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

      {/* Contacts List */}
      <div className="space-y-4">
        {filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <IconUsers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search query or filters' : 'Start by adding contacts to your database'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredContacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="p-6">
                <div className="grid grid-cols-12 gap-6">
                  {/* Contact Info */}
                  <div className="col-span-12 lg:col-span-4 flex items-start gap-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <IconUser className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold">{contact['Full Name']}</h3>
                        {contact['Role'] && (
                          <Badge variant={
                            contact['Role'] === 'Champion' ? 'destructive' :
                            contact['Role'] === 'Decision Maker' ? 'default' :
                            'secondary'
                          }>
                            {contact['Role']}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {contact['Job Title'] || 'No job title'}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <IconBuildingSkyscraper className="h-4 w-4 text-muted-foreground" />
                        <span>{contact['Company Name'] || 'No company'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="col-span-12 lg:col-span-5 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <IconMail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${contact['Email']}`} className="text-primary hover:underline">
                        {contact['Email']}
                      </a>
                    </div>
                    {contact['Phone'] && (
                      <div className="flex items-center gap-2 text-sm">
                        <IconPhone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${contact['Phone']}`} className="hover:underline">
                          {contact['Phone']}
                        </a>
                      </div>
                    )}
                    {contact['LinkedIn URL'] && (
                      <div className="flex items-center gap-2 text-sm">
                        <IconBrandLinkedin className="h-4 w-4 text-muted-foreground" />
                        <a href={contact['LinkedIn URL']} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                    {contact['Location'] && (
                      <div className="flex items-center gap-2 text-sm">
                        <IconMapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{contact['Location']}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats & Actions */}
                  <div className="col-span-12 lg:col-span-3 flex flex-col items-end justify-between">
                    <div className="text-right space-y-2">
                      <div>
                        <div className="text-2xl font-bold">{contact['TalentGuard Score'] || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">TalentGuard Score</div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconTrendingUp className="h-4 w-4" />
                        <span>{contact['Buying Signals'] || 0} buying signals</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">View Profile</Button>
                    </div>
                  </div>
                </div>
                
                {/* Notes */}
                {contact['Notes'] && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Latest: </span>
                      {contact['Notes']}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}