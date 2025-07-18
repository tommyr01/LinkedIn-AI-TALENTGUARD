import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Briefcase, 
  Target,
  Star,
  MessageCircle,
  Calendar,
  ExternalLink,
  TrendingUp
} from 'lucide-react'

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
      {/* Modern header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Contact Profiles
        </h1>
        <p className="text-lg text-gray-600">
          Manage and track your buying committee contacts with AI-powered insights
        </p>
      </div>

      {/* Search and filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search contacts by name, company, or title..."
                className="pl-10 h-12 rounded-lg border-0 bg-gray-50"
              />
            </div>
            <Button variant="outline" className="h-12 px-4 rounded-lg">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg">
              Add Contact
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact cards */}
      <div className="grid gap-6">
        {contacts.map((contact) => (
          <Card key={contact.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Main contact info */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 ring-2 ring-blue-100">
                      <AvatarImage src={contact.avatar} alt={contact.name} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-gray-900">{contact.name}</h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Briefcase className="h-4 w-4" />
                        <span className="font-medium">{contact.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span>{contact.company}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm">{contact.companySize} employees</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{contact.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{contact.phone}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className={`px-3 py-1 ${
                          tag === 'Hot Lead' ? 'bg-red-100 text-red-700' :
                          tag === 'Decision Maker' ? 'bg-purple-100 text-purple-700' :
                          tag === 'Budget Owner' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Notes */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {contact.notes}
                    </p>
                  </div>
                </div>

                {/* Sidebar with scores and actions */}
                <div className="lg:col-span-4 space-y-4">
                  {/* TalentGuard Score */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
                    <CardContent className="p-4 text-center">
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">TalentGuard Score</span>
                        </div>
                        <div className="text-3xl font-bold text-blue-900">
                          {contact.talentGuardScore}
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${
                                i < Math.floor(contact.talentGuardScore / 20) 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Buying Signals */}
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-0">
                    <CardContent className="p-4 text-center">
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Buying Signals</span>
                        </div>
                        <div className="text-3xl font-bold text-green-900">
                          {contact.buyingSignals}/10
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${contact.buyingSignals * 10}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline" className="w-full h-12 rounded-lg">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Meeting
                    </Button>
                  </div>

                  {/* Meeting History */}
                  <Card className="bg-gray-50 border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-700">
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {contact.meetingHistory.slice(0, 2).map((meeting, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div>
                            <div className="font-medium text-gray-900">{meeting.type}</div>
                            <div className="text-gray-500">{meeting.date}</div>
                          </div>
                          <div className="text-gray-600">{meeting.duration}</div>
                        </div>
                      ))}
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
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