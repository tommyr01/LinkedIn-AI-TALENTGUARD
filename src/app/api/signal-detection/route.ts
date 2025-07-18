import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { companies, contacts } = await request.json()

    if (!companies && !contacts) {
      return NextResponse.json(
        { error: 'Either companies or contacts array is required' },
        { status: 400 }
      )
    }

    // Mock signal detection results
    // In production, this would integrate with various data sources:
    // - LinkedIn Sales Navigator
    // - News APIs
    // - Job board APIs
    // - Company websites
    // - Social media monitoring
    // - Funding databases
    
    const mockSignals = [
      {
        id: 1,
        type: "hiring_surge",
        title: "Massive Hiring Surge Detected",
        description: "TechCorp Inc. posted 45 new job openings in the last 30 days",
        company: "TechCorp Inc.",
        companyId: 1,
        contact: "Sarah Johnson",
        contactId: 1,
        score: 95,
        priority: "high",
        confidence: 0.92,
        detected: "2024-01-28T10:00:00Z",
        sources: [
          "LinkedIn job postings",
          "Company careers page",
          "Job board aggregation"
        ],
        metadata: {
          jobPostings: 45,
          previousPeriod: 8,
          growth: "+462%",
          departments: ["Engineering", "Sales", "Marketing", "Customer Success"],
          locations: ["San Francisco", "Austin", "New York"]
        }
      },
      {
        id: 2,
        type: "leadership_change",
        title: "New CPO Appointment",
        description: "GrowthStart hired Michael Chen as new Chief People Officer",
        company: "GrowthStart",
        companyId: 2,
        contact: "Michael Chen",
        contactId: 2,
        score: 87,
        priority: "high",
        confidence: 0.88,
        detected: "2024-01-25T14:30:00Z",
        sources: [
          "LinkedIn announcements",
          "Company press release",
          "Industry publications"
        ],
        metadata: {
          position: "Chief People Officer",
          startDate: "2024-01-15",
          previousCompany: "MetaTech Corp",
          teamSize: 12,
          focus: "Scaling operations"
        }
      },
      {
        id: 3,
        type: "funding_round",
        title: "Series B Funding Completed",
        description: "GrowthStart raised $25M Series B to accelerate growth",
        company: "GrowthStart",
        companyId: 2,
        contact: "Michael Chen",
        contactId: 2,
        score: 90,
        priority: "high",
        confidence: 0.95,
        detected: "2024-01-20T09:15:00Z",
        sources: [
          "TechCrunch",
          "Company blog",
          "SEC filings"
        ],
        metadata: {
          amount: "$25M",
          round: "Series B",
          investors: ["Accel Partners", "Sequoia Capital"],
          valuation: "$200M",
          use: "Team expansion and product development"
        }
      },
      {
        id: 4,
        type: "budget_approval",
        title: "Q1 Budget Approved",
        description: "FinanceFlow approved $2.5M budget for talent acquisition technology",
        company: "FinanceFlow",
        companyId: 3,
        contact: "Emily Rodriguez",
        contactId: 3,
        score: 98,
        priority: "urgent",
        confidence: 0.89,
        detected: "2024-01-26T16:45:00Z",
        sources: [
          "Internal communications",
          "Procurement announcements",
          "Vendor inquiries"
        ],
        metadata: {
          budget: "$2.5M",
          timeline: "Q1 2024",
          category: "Talent Acquisition Technology",
          approvers: ["CEO", "CFO", "CPO"],
          procurement: "Active"
        }
      },
      {
        id: 5,
        type: "competitor_mention",
        title: "Competitor Evaluation",
        description: "DataFlow mentioned evaluating TalentGuard competitors",
        company: "DataFlow",
        companyId: 4,
        contact: "Alex Thompson",
        contactId: 4,
        score: 72,
        priority: "medium",
        confidence: 0.76,
        detected: "2024-01-24T11:20:00Z",
        sources: [
          "LinkedIn post",
          "Industry forums",
          "Social media monitoring"
        ],
        metadata: {
          competitors: ["CompetitorA", "CompetitorB"],
          context: "Evaluating talent analytics solutions",
          sentiment: "Neutral",
          engagement: "High"
        }
      }
    ]

    // Filter signals based on provided companies/contacts
    let filteredSignals = mockSignals
    
    if (companies && Array.isArray(companies)) {
      filteredSignals = filteredSignals.filter(signal => 
        companies.includes(signal.companyId)
      )
    }
    
    if (contacts && Array.isArray(contacts)) {
      filteredSignals = filteredSignals.filter(signal => 
        contacts.includes(signal.contactId)
      )
    }

    // Sort by score (highest first)
    filteredSignals.sort((a, b) => b.score - a.score)

    // Simulate signal detection processing time
    await new Promise(resolve => setTimeout(resolve, 1500))

    return NextResponse.json({
      success: true,
      data: {
        signals: filteredSignals,
        summary: {
          total: filteredSignals.length,
          urgent: filteredSignals.filter(s => s.priority === 'urgent').length,
          high: filteredSignals.filter(s => s.priority === 'high').length,
          medium: filteredSignals.filter(s => s.priority === 'medium').length,
          averageScore: filteredSignals.reduce((acc, s) => acc + s.score, 0) / filteredSignals.length
        },
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Signal detection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}