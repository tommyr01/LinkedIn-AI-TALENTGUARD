"use client"

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconSearch, IconMail, IconUsers, IconExternalLink, IconTarget, IconBrain, IconCalendar, IconClipboardList } from '@tabler/icons-react'

// Type definition for API contact data (works with both Airtable and Supabase)
interface Contact {
  id: string
  // Airtable fields (PascalCase)
  Name?: string
  Title?: string
  Email?: string
  'LinkedIn URL'?: string
  'Role Category'?: string
  Account?: string[]
  'Total Signals'?: number
  'Latest Signal Date'?: string
  'Signal Summary'?: {
    state: string
    value: string
    isStale: boolean
  }
  'Role Impact Score'?: {
    state: string
    value: string
    isStale: boolean
  }
  Tasks?: string[]
  // Supabase fields (snake_case)
  name?: string
  title?: string
  email?: string
  linkedin_url?: string
  role_category?: string
  account_id?: string
  total_signals?: number
  latest_signal_date?: string
  created_at?: string
}

// Helper function to get normalized field values
const getFieldValue = (contact: Contact) => ({
  name: contact.Name || contact.name || 'Unnamed Contact',
  title: contact.Title || contact.title || 'No title',
  email: contact.Email || contact.email || 'No email',
  linkedinUrl: contact['LinkedIn URL'] || contact.linkedin_url || '',
  roleCategory: contact['Role Category'] || contact.role_category || 'Unknown',
  totalSignals: contact['Total Signals'] || contact.total_signals || 0,
  latestSignalDate: contact['Latest Signal Date'] || contact.latest_signal_date || 'No date',
  signalSummary: contact['Signal Summary'],
  roleImpactScore: contact['Role Impact Score'],
  tasks: contact.Tasks || [],
  account: contact.Account || (contact.account_id ? [contact.account_id] : [])
})

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
})

// Role category color mapping
const roleCategoryColors = {
  'Exec Sponsor': 'bg-blue-100 text-blue-800 border-blue-200',
  'Champion': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Buyer': 'bg-teal-100 text-teal-800 border-teal-200',
  'Tech Validator': 'bg-green-100 text-green-800 border-green-200',
  'Other': 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: contacts, isLoading, error } = useSWR<Contact[]>('/api/contacts', fetcher)

  // Stats calculations
  const totalContacts = contacts?.length || 0
  const execSponsors = contacts?.filter((c: Contact) => {
    const fields = getFieldValue(c);
    return fields.roleCategory === 'Exec Sponsor';
  }).length || 0
  const avgSignals = Math.round((contacts?.reduce((acc: number, curr: Contact) => {
    const fields = getFieldValue(curr);
    return acc + fields.totalSignals;
  }, 0) || 0) / (totalContacts || 1))

  // Filter contacts based on search
  const filteredContacts = contacts?.filter((c: Contact) => {
    const fields = getFieldValue(c);
    return fields.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           fields.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           fields.roleCategory.toLowerCase().includes(searchQuery.toLowerCase());
  }) || []

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading contacts...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Failed to load contacts</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Contacts</h1>
        <p className="text-muted-foreground">
          Manage and engage with your key contacts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <IconUsers className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Contacts</p>
                <p className="text-2xl font-bold">{totalContacts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <IconTarget className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Exec Sponsors</p>
                <p className="text-2xl font-bold">{execSponsors}</p>
              </div>
          </div>
        </CardContent>
      </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <IconMail className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Avg Signals</p>
                <p className="text-2xl font-bold">{avgSignals}</p>
                      </div>
                      </div>
          </CardContent>
        </Card>
                      </div>
                      
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search contacts by name, title, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
                    </div>
                  </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredContacts.length === 0 ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">No contacts found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
                    </div>
                  </div>
        ) : (
          filteredContacts.map((contact: Contact) => {
            const fields = getFieldValue(contact);
            return (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {fields.name}
                      <Badge 
                        variant="outline" 
                        className={roleCategoryColors[fields.roleCategory as keyof typeof roleCategoryColors] || roleCategoryColors.Other}
                      >
                        {fields.roleCategory}
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">{fields.title}</span>
                      {fields.linkedinUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={() => window.open(fields.linkedinUrl, '_blank')}
                        >
                          <IconExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {fields.totalSignals || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Signals</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Contact Stats */}
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <IconMail className="h-4 w-4 text-muted-foreground" />
                    <span>{fields.email}</span>
                        </div>
                  <div className="flex items-center gap-1">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <span>{fields.latestSignalDate}</span>
                        </div>
                  <div className="flex items-center gap-1">
                    <IconClipboardList className="h-4 w-4 text-muted-foreground" />
                    <span>{fields.tasks?.length || 0} tasks</span>
                        </div>
                      </div>

                {/* AI-Generated Signal Summary */}
                {fields.signalSummary?.value && (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <IconBrain className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">Signal Summary</p>
                        </div>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-md">
                      {fields.signalSummary.value}
                    </p>
                  </div>
                )}

                {/* AI-Generated Role Impact Score */}
                {fields.roleImpactScore?.value && (
                          <div>
                    <div className="flex items-center gap-1 mb-2">
                      <IconTarget className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">Role Impact Score</p>
                          </div>
                    <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded-md">
                      {fields.roleImpactScore.value}
                    </p>
                        </div>
                )}
                    </CardContent>
                  </Card>
          )})
        )}
      </div>
    </div>
  )
}