import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  IconSearch, 
  IconFilter, 
  IconMail, 
  IconPhone, 
  IconMapPin, 
  IconBuilding, 
  IconBriefcase, 
  IconTarget,
  IconStar,
  IconMessageCircle,
  IconCalendar,
  IconExternalLink,
  IconTrendingUp
} from '@tabler/icons-react'

export default function ContactsPage() {
  // Mock data for contacts
  const contacts = [
    {
      id: 1,
      name: "Sarah Johnson",
      title: "VP of People Operations",
      company: "TechCorp Inc.",
      location: "San Francisco, CA",
      email: "sarah.johnson@techcorp.com",
      phone: "+1 (555) 123-4567",
      avatar: "/api/placeholder/150/150",
      linkedinUrl: "https://linkedin.com/in/sarah-johnson",
      buyingSignals: 8,
      talentGuardScore: 92,
      tags: ["HR Tech", "Decision Maker", "Budget Owner"],
      lastActivity: "2 days ago",
      companySize: "500-1000",
      industry: "Technology",
      notes: "Showed interest in talent analytics platform. Mentioned Q2 budget planning.",
      meetingHistory: [
        { date: "2024-01-15", type: "Discovery Call", duration: "45 min" },
        { date: "2024-01-22", type: "Demo", duration: "30 min" }
      ]
    },
    {
      id: 2,
      name: "Michael Chen",
      title: "Chief People Officer",
      company: "GrowthStart",
      location: "Austin, TX",
      email: "m.chen@growthstart.io",
      phone: "+1 (555) 987-6543",
      avatar: "/api/placeholder/150/150",
      linkedinUrl: "https://linkedin.com/in/michael-chen",
      buyingSignals: 6,
      talentGuardScore: 78,
      tags: ["CPO", "Strategic", "Growing Team"],
      lastActivity: "5 days ago",
      companySize: "100-500",
      industry: "SaaS",
      notes: "Expanding team by 200% this year. Looking for talent intelligence solutions.",
      meetingHistory: [
        { date: "2024-01-10", type: "Initial Contact", duration: "15 min" }
      ]
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      title: "Director of Talent Acquisition",
      company: "FinanceFlow",
      location: "New York, NY",
      email: "emily.r@financeflow.com",
      phone: "+1 (555) 456-7890",
      avatar: "/api/placeholder/150/150",
      linkedinUrl: "https://linkedin.com/in/emily-rodriguez",
      buyingSignals: 9,
      talentGuardScore: 95,
      tags: ["Hot Lead", "Urgent Need", "Budget Approved"],
      lastActivity: "1 day ago",
      companySize: "1000+",
      industry: "Financial Services",
      notes: "Urgent need for talent intelligence. Budget already approved for Q1.",
      meetingHistory: [
        { date: "2024-01-20", type: "Discovery Call", duration: "60 min" },
        { date: "2024-01-25", type: "Technical Demo", duration: "45 min" },
        { date: "2024-01-28", type: "Stakeholder Meeting", duration: "30 min" }
      ]
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Contact Profiles
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage and track your buying committee contacts with AI-powered insights
        </p>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search contacts by name, company, or title..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <IconFilter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button>
              Add Contact
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact cards */}
      <div className="grid gap-6">
        {contacts.map((contact) => (
          <Card key={contact.id}>
            <CardContent className="p-6">
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Main contact info */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={contact.avatar} alt={contact.name} />
                      <AvatarFallback className="text-lg font-semibold">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold">{contact.name}</h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <IconExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <IconBriefcase className="h-4 w-4" />
                        <span className="font-medium">{contact.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <IconBuilding className="h-4 w-4" />
                        <span>{contact.company}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="text-sm">{contact.companySize} employees</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <IconMapPin className="h-4 w-4" />
                        <span>{contact.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconMail className="h-4 w-4" />
                      <span className="text-sm">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconPhone className="h-4 w-4" />
                      <span className="text-sm">{contact.phone}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant={
                          tag === 'Hot Lead' ? 'destructive' :
                          tag === 'Decision Maker' ? 'secondary' :
                          tag === 'Budget Owner' ? 'default' :
                          'outline'
                        }
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Notes */}
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {contact.notes}
                    </p>
                  </div>
                </div>

                {/* Sidebar with scores and actions */}
                <div className="lg:col-span-4 space-y-4">
                  {/* TalentGuard Score */}
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <IconTarget className="h-5 w-5" />
                          <span className="text-sm font-medium">TalentGuard Score</span>
                        </div>
                        <div className="text-3xl font-bold">
                          {contact.talentGuardScore}
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <IconStar 
                              key={i} 
                              className={`h-4 w-4 ${
                                i < Math.floor(contact.talentGuardScore / 20) 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-muted-foreground'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Buying Signals */}
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <IconTrendingUp className="h-5 w-5" />
                          <span className="text-sm font-medium">Buying Signals</span>
                        </div>
                        <div className="text-3xl font-bold">
                          {contact.buyingSignals}/10
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${contact.buyingSignals * 10}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button className="w-full h-12">
                      <IconMessageCircle className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline" className="w-full h-12">
                      <IconCalendar className="h-4 w-4 mr-2" />
                      Schedule Meeting
                    </Button>
                  </div>

                  {/* Meeting History */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {contact.meetingHistory.slice(0, 2).map((meeting, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div>
                            <div className="font-medium">{meeting.type}</div>
                            <div className="text-muted-foreground">{meeting.date}</div>
                          </div>
                          <div className="text-muted-foreground">{meeting.duration}</div>
                        </div>
                      ))}
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Last activity: {contact.lastActivity}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}