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

// Type definition for Airtable contact data
interface AirtableContact {
  id: string
  Name?: string
  'First Name'?: string
  'Last Name'?: string
  Email?: string
  Phone?: string
  Title?: string
  Department?: string
  Company?: string
  'Company ID'?: string
  Location?: string
  'LinkedIn URL'?: string
  'TalentGuard Score'?: number
  Status?: string
  'Last Contact'?: string
  [key: string]: any // Allow additional fields
}

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: contacts, isLoading, error } = useSWR<AirtableContact[]>('/api/contacts', fetcher)

  // Stats calculations
  const totalContacts = contacts?.length || 0
  const highValueContacts = contacts?.filter((c: AirtableContact) => (c['TalentGuard Score'] || 0) > 80).length || 0
  const recentContacts = contacts?.filter((c: AirtableContact) => c['Last Contact'])?.length || 0
  const avgScore = (contacts?.reduce((acc: number, curr: AirtableContact) => acc + (curr['TalentGuard Score'] || 0), 0) || 0) / (totalContacts || 1)

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
        <div className="flex flex-col items-center gap-2">
          <p className="text-destructive">Failed to load contacts</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Filter contacts based on search
  const filteredContacts = contacts?.filter((c: AirtableContact) => 
    c.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.Email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.Title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.Company?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            Manage and track buying committee members
          </p>
        </div>
        <Button>
          <IconUser className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              In your database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Value</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highValueContacts}</div>
            <p className="text-xs text-muted-foreground">
              Score above 80
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buying Committee</CardTitle>
            <IconBriefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentContacts}</div>
            <p className="text-xs text-muted-foreground">
              Active contacts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              TalentGuard score
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
                placeholder="Search contacts by name, email, title, or company..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContacts.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                No contacts found matching your search.
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredContacts.map((contact: AirtableContact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Contact Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <IconUser className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {contact.Name || `${contact['First Name'] || ''} ${contact['Last Name'] || ''}`.trim() || 'Unnamed Contact'}
                        </h3>
                        <p className="text-sm text-muted-foreground">{contact.Title || 'No title'}</p>
                      </div>
                    </div>
                    {contact.Status && (
                      <Badge variant={contact.Status === 'Active' ? 'default' : 'secondary'}>
                        {contact.Status}
                      </Badge>
                    )}
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2">
                    {contact.Company && (
                      <div className="flex items-center gap-2 text-sm">
                        <IconBuildingSkyscraper className="h-4 w-4 text-muted-foreground" />
                        <span>{contact.Company}</span>
                      </div>
                    )}
                    {contact.Email && (
                      <div className="flex items-center gap-2 text-sm">
                        <IconMail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${contact.Email}`} className="text-primary hover:underline">
                          {contact.Email}
                        </a>
                      </div>
                    )}
                    {contact.Phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <IconPhone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${contact.Phone}`} className="text-primary hover:underline">
                          {contact.Phone}
                        </a>
                      </div>
                    )}
                    {contact['Location'] && (
                      <div className="flex items-center gap-2 text-sm">
                        <IconMapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{contact['Location']}</span>
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
                  </div>

                  {/* Score */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{contact['TalentGuard Score'] || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">TalentGuard Score</div>
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
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