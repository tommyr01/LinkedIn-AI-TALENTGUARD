"use client"

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { IconSearch, IconMail, IconBrandLinkedin, IconUsers, IconTarget, IconClock, IconBrain, IconTrendingUp, IconBuilding, IconExternalLink } from '@tabler/icons-react'

// Type definition for API contact data based on actual Airtable structure
interface Contact {
  id: string
  name: string
  title: string
  email: string
  linkedinUrl: string
  roleCategory: string
  account: string[]
  signals: string[]
  totalSignals: number
  latestSignalDate: string
  signalSummary: {
    state: string
    value: string
    isStale: boolean
  }
  roleImpactScore: {
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

// Role category color mapping
const roleCategoryColors = {
  'Exec Sponsor': 'bg-blue-100 text-blue-800 border-blue-200',
  'Champion': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Buyer': 'bg-teal-100 text-teal-800 border-teal-200',
  'Tech Validator': 'bg-green-100 text-green-800 border-green-200',
  'Other': 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

// Role category icons
const roleCategoryIcons = {
  'Exec Sponsor': '👑',
  'Champion': '🏆',
  'Buyer': '💰',
  'Tech Validator': '🔧',
  'Other': '👤'
}

// Get initials for avatar
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Get signal activity level color
const getSignalActivityColor = (count: number) => {
  if (count >= 5) return 'text-green-600'
  if (count >= 2) return 'text-yellow-600'
  return 'text-red-600'
}

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: contacts, isLoading, error } = useSWR<Contact[]>('/api/contacts', fetcher)

  // Stats calculations
  const totalContacts = contacts?.length || 0
  const executiveContacts = contacts?.filter((c: Contact) => 
    c.roleCategory === 'Exec Sponsor' || c.roleCategory === 'Champion'
  ).length || 0
  const activeContacts = contacts?.filter((c: Contact) => c.totalSignals > 0).length || 0
  const avgSignals = Math.round((contacts?.reduce((acc: number, curr: Contact) => acc + (curr.totalSignals || 0), 0) || 0) / (totalContacts || 1))

  // Filter contacts based on search
  const filteredContacts = contacts?.filter((c: Contact) => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.roleCategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

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
          Manage and track your key contacts and their engagement
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Executives</p>
                <p className="text-2xl font-bold">{executiveContacts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <IconTarget className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Active Contacts</p>
                <p className="text-2xl font-bold">{activeContacts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <IconClock className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Avg Signals</p>
                <p className={`text-2xl font-bold ${getSignalActivityColor(avgSignals)}`}>{avgSignals}</p>
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
            placeholder="Search contacts by name, title, role, or email..."
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
          filteredContacts.map((contact: Contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(contact.name || 'Unknown')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {contact.name || 'Unknown Contact'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.title || 'No title'}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${roleCategoryColors[contact.roleCategory as keyof typeof roleCategoryColors] || roleCategoryColors.Other}`}
                      >
                        <span className="mr-1">
                          {roleCategoryIcons[contact.roleCategory as keyof typeof roleCategoryIcons] || '👤'}
                        </span>
                        {contact.roleCategory || 'Other'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getSignalActivityColor(contact.totalSignals)}`}>
                      {contact.totalSignals || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Signals</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    {contact.email && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-xs"
                        onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
                      >
                        <IconMail className="h-3 w-3 mr-1" />
                        Email
                      </Button>
                    )}
                    {contact.linkedinUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-xs"
                        onClick={() => window.open(contact.linkedinUrl, '_blank')}
                      >
                        <IconBrandLinkedin className="h-3 w-3 mr-1" />
                        LinkedIn
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <IconBuilding className="h-3 w-3" />
                    <span>{contact.tasks?.length || 0} tasks</span>
                  </div>
                </div>

                {/* AI-Generated Role Impact Score */}
                {contact.roleImpactScore?.value && (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <IconTrendingUp className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">Role Impact</p>
                    </div>
                    <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded-md">
                      {contact.roleImpactScore.value}
                    </p>
                  </div>
                )}

                {/* AI-Generated Signal Summary */}
                {contact.signalSummary?.value && (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <IconBrain className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">Signal Summary</p>
                    </div>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-md">
                      {contact.signalSummary.value}
                    </p>
                  </div>
                )}

                {/* Latest Signal Date */}
                {contact.latestSignalDate && contact.latestSignalDate !== '1970-01-01' && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <IconClock className="h-3 w-3" />
                      Latest signal: {contact.latestSignalDate}
                    </div>
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