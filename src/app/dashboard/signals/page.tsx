"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Calendar, 
  Building2, 
  Users, 
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Zap,
  DollarSign,
  MessageSquare,
  Award,
  Activity
} from 'lucide-react'

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
      icon: TrendingUp,
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
      icon: Users,
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
      icon: DollarSign,
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
      icon: MessageSquare,
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
      icon: Building2,
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
      icon: Zap,
      color: "yellow"
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800'
    if (score >= 80) return 'bg-blue-100 text-blue-800'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Hiring Activity': return TrendingUp
      case 'Leadership Change': return Users
      case 'Budget Signal': return DollarSign
      case 'Competitive Intelligence': return MessageSquare
      case 'Expansion Signal': return Building2
      case 'Technology Signal': return Zap
      default: return Activity
    }
  }

  return (
    <div className="space-y-8">
      {/* Modern header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Signal Intelligence
        </h1>
        <p className="text-lg text-gray-600">
          AI-powered buying signals and market intelligence for your target accounts
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Urgent Signals</p>
                <p className="text-2xl font-bold text-red-900">
                  {signals.filter(s => s.priority === 'urgent').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">High Priority</p>
                <p className="text-2xl font-bold text-orange-900">
                  {signals.filter(s => s.priority === 'high').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Signals</p>
                <p className="text-2xl font-bold text-blue-900">{signals.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Avg Score</p>
                <p className="text-2xl font-bold text-green-900">
                  {Math.round(signals.reduce((acc, s) => acc + s.score, 0) / signals.length)}
                </p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search signals by company, contact, or type..."
                className="pl-10 h-12 rounded-lg border-0 bg-gray-50"
              />
            </div>
            <Button variant="outline" className="h-12 px-4 rounded-lg">
              <Filter className="h-4 w-4 mr-2" />
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
            <Card key={signal.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full bg-gradient-to-r ${
                    signal.color === 'red' ? 'from-red-500 to-red-600' :
                    signal.color === 'purple' ? 'from-purple-500 to-purple-600' :
                    signal.color === 'green' ? 'from-green-500 to-green-600' :
                    signal.color === 'orange' ? 'from-orange-500 to-orange-600' :
                    signal.color === 'blue' ? 'from-blue-500 to-blue-600' :
                    'from-yellow-500 to-yellow-600'
                  }`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold text-gray-900">{signal.title}</h3>
                          <Badge className={`${getPriorityColor(signal.priority)} border`}>
                            {signal.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{signal.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(signal.score)}`}>
                            {signal.score} Score
                          </div>
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-9 px-3 rounded-lg"
                              onClick={() => setSelectedSignal(signal)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
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
                                    <p className="text-sm font-medium text-gray-700 mb-1">Company</p>
                                    <p className="text-gray-900">{selectedSignal.company}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Contact</p>
                                    <p className="text-gray-900">{selectedSignal.contact}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Score</p>
                                    <Badge className={getScoreColor(selectedSignal.score)}>
                                      {selectedSignal.score}/100
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Date</p>
                                    <p className="text-gray-900">{selectedSignal.date}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-3">Signal Details</p>
                                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    {Object.entries(selectedSignal.details).map(([key, value]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                        <span className="font-medium">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-3">Recommended Actions</p>
                                  <div className="space-y-2">
                                    {selectedSignal.actionItems.map((action: string, index: number) => (
                                      <div key={index} className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">{action}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="flex gap-3 pt-4 border-t">
                                  <Button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
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
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        <span>{signal.company}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{signal.contact}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CategoryIcon className="h-4 w-4" />
                        <span>{signal.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
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