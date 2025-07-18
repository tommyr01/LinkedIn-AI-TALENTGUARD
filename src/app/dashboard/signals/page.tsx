"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  IconSearch, 
  IconFilter, 
  IconTrendingUp, 
  IconTrendingDown, 
  IconEye, 
  IconCalendar, 
  IconBuilding, 
  IconUsers, 
  IconTarget,
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconExternalLink,
  IconBolt,
  IconCurrencyDollar,
  IconMessage,
  IconAward,
  IconActivity
} from '@tabler/icons-react'

export default function SignalsPage() {
  const [selectedSignal, setSelectedSignal] = useState<any>(null)

  // Mock data for signals
  const signals = [
    {
      id: 1,
      type: "hiring_surge",
      title: "Massive Hiring Surge",
      description: "TechCorp Inc. posted 45 new job openings in the last 30 days",
      company: "TechCorp Inc.",
      contact: "Sarah Johnson",
      contactTitle: "VP of People Operations",
      score: 95,
      priority: "high",
      date: "2024-01-28",
      category: "Hiring Activity",
      details: {
        jobPostings: 45,
        departments: ["Engineering", "Sales", "Marketing", "Customer Success"],
        timeframe: "30 days",
        previousPeriod: 8,
        growth: "+462%"
      },
      actionItems: [
        "Reach out to VP of People Operations",
        "Highlight talent analytics capabilities",
        "Offer scaling support solutions"
      ],
      icon: IconTrendingUp,
      color: "red"
    },
    {
      id: 2,
      type: "leadership_change",
      title: "New CPO Appointment",
      description: "GrowthStart hired a new Chief People Officer from a major tech company",
      company: "GrowthStart",
      contact: "Michael Chen",
      contactTitle: "Chief People Officer",
      score: 87,
      priority: "high",
      date: "2024-01-25",
      category: "Leadership Change",
      details: {
        newExecutive: "Michael Chen",
        previousCompany: "MetaTech Corp",
        startDate: "2024-01-15",
        department: "People Operations",
        teamSize: "12 reports"
      },
      actionItems: [
        "Welcome new CPO with congratulations",
        "Share case studies from similar companies",
        "Offer 90-day planning consultation"
      ],
      icon: IconUsers,
      color: "purple"
    },
    {
      id: 3,
      type: "budget_approval",
      title: "Q1 Budget Approved",
      description: "FinanceFlow approved $2.5M budget for talent acquisition technology",
      company: "FinanceFlow",
      contact: "Emily Rodriguez",
      contactTitle: "Director of Talent Acquisition",
      score: 98,
      priority: "urgent",
      date: "2024-01-26",
      category: "Budget Signal",
      details: {
        budget: "$2.5M",
        timeline: "Q1 2024",
        focus: "Talent Acquisition Technology",
        decisionMakers: ["CEO", "CFO", "CPO"],
        procurement: "Already started"
      },
      actionItems: [
        "Schedule immediate demo",
        "Prepare ROI analysis",
        "Connect with procurement team"
      ],
      icon: IconCurrencyDollar,
      color: "green"
    },
    {
      id: 4,
      type: "competitor_mention",
      title: "Competitor Evaluation",
      description: "DataFlow mentioned considering TalentGuard competitors in recent LinkedIn post",
      company: "DataFlow",
      contact: "Alex Thompson",
      contactTitle: "Head of Talent",
      score: 72,
      priority: "medium",
      date: "2024-01-24",
      category: "Competitive Intelligence",
      details: {
        platform: "LinkedIn",
        competitors: ["CompetitorA", "CompetitorB"],
        context: "Evaluating talent analytics solutions",
        engagement: "12 likes, 5 comments",
        sentiment: "Neutral"
      },
      actionItems: [
        "Monitor competitive discussions",
        "Prepare differentiation materials",
        "Engage with LinkedIn post"
      ],
      icon: IconMessage,
      color: "orange"
    },
    {
      id: 5,
      type: "expansion_signal",
      title: "Office Expansion",
      description: "ScaleUp Inc. announced new office opening in Austin, planning to hire 200+ employees",
      company: "ScaleUp Inc.",
      contact: "Lisa Park",
      contactTitle: "VP of Operations",
      score: 83,
      priority: "medium",
      date: "2024-01-22",
      category: "Expansion Signal",
      details: {
        newLocation: "Austin, TX",
        plannedHires: 200,
        timeline: "6 months",
        departments: ["Engineering", "Sales", "Operations"],
        officeSize: "50,000 sq ft"
      },
      actionItems: [
        "Highlight scaling expertise",
        "Share Austin market insights",
        "Offer local hiring support"
      ],
      icon: IconBuilding,
      color: "blue"
    },
    {
      id: 6,
      type: "technology_adoption",
      title: "AI Initiative Launch",
      description: "InnovateCorp launched company-wide AI adoption initiative with focus on HR automation",
      company: "InnovateCorp",
      contact: "David Kim",
      contactTitle: "Chief Technology Officer",
      score: 78,
      priority: "medium",
      date: "2024-01-20",
      category: "Technology Signal",
      details: {
        initiative: "AI-First HR",
        investment: "$1.2M",
        timeline: "12 months",
        focus: ["Recruitment", "Performance", "Analytics"],
        consultant: "McKinsey & Company"
      },
      actionItems: [
        "Position AI capabilities",
        "Share AI implementation case studies",
        "Offer pilot program"
      ],
      icon: IconBolt,
      color: "yellow"
    }
  ]


  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Hiring Activity': return IconTrendingUp
      case 'Leadership Change': return IconUsers
      case 'Budget Signal': return IconCurrencyDollar
      case 'Competitive Intelligence': return IconMessage
      case 'Expansion Signal': return IconBuilding
      case 'Technology Signal': return IconBolt
      default: return IconActivity
    }
  }

  return (
    <div className="space-y-8">
      {/* Modern header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Signal Intelligence
        </h1>
        <p className="text-lg text-muted-foreground">
          AI-powered buying signals and market intelligence for your target accounts
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Urgent Signals</p>
                <p className="text-2xl font-bold">
                  {signals.filter(s => s.priority === 'urgent').length}
                </p>
              </div>
              <IconAlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">High Priority</p>
                <p className="text-2xl font-bold">
                  {signals.filter(s => s.priority === 'high').length}
                </p>
              </div>
              <IconTarget className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Signals</p>
                <p className="text-2xl font-bold">{signals.length}</p>
              </div>
              <IconActivity className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Avg Score</p>
                <p className="text-2xl font-bold">
                  {Math.round(signals.reduce((acc, s) => acc + s.score, 0) / signals.length)}
                </p>
              </div>
              <IconAward className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search signals by company, contact, or type..."
                className="pl-10 h-12"
              />
            </div>
            <Button variant="outline" className="h-12 px-4">
              <IconFilter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Signals list */}
      <div className="space-y-4">
        {signals.map((signal) => {
          const IconComponent = signal.icon
          const CategoryIcon = getCategoryIcon(signal.category)
          
          return (
            <Card key={signal.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-muted">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold">{signal.title}</h3>
                          <Badge variant={
                            signal.priority === 'urgent' ? 'destructive' :
                            signal.priority === 'high' ? 'default' :
                            'secondary'
                          }>
                            {signal.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{signal.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant="outline">
                            {signal.score} Score
                          </Badge>
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-9 px-3"
                              onClick={() => setSelectedSignal(signal)}
                            >
                              <IconEye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <IconComponent className="h-5 w-5" />
                                {signal.title}
                              </DialogTitle>
                            </DialogHeader>
                            
                            {selectedSignal && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Company</p>
                                    <p>{selectedSignal.company}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Contact</p>
                                    <p>{selectedSignal.contact}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Score</p>
                                    <Badge variant="outline">
                                      {selectedSignal.score}/100
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Date</p>
                                    <p>{selectedSignal.date}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-3">Signal Details</p>
                                  <div className="bg-muted rounded-lg p-4 space-y-2">
                                    {Object.entries(selectedSignal.details).map(([key, value]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                        <span className="font-medium">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-3">Recommended Actions</p>
                                  <div className="space-y-2">
                                    {selectedSignal.actionItems.map((action: string, index: number) => (
                                      <div key={index} className="flex items-start gap-2">
                                        <IconCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{action}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="flex gap-3 pt-4 border-t">
                                  <Button className="flex-1">
                                    Take Action
                                  </Button>
                                  <Button variant="outline" className="flex-1">
                                    Schedule Follow-up
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <IconBuilding className="h-4 w-4" />
                        <span>{signal.company}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconUsers className="h-4 w-4" />
                        <span>{signal.contact}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CategoryIcon className="h-4 w-4" />
                        <span>{signal.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconCalendar className="h-4 w-4" />
                        <span>{signal.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}