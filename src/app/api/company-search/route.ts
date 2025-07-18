import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // Mock company search results
    // In production, this would integrate with LinkedIn Sales Navigator API,
    // Apollo.io, ZoomInfo, or similar data providers
    const mockCompanies = [
      {
        id: 1,
        name: "TechCorp Inc.",
        domain: "techcorp.com",
        industry: "Technology",
        size: "500-1000",
        location: "San Francisco, CA",
        description: "Leading enterprise software company specializing in cloud solutions",
        linkedin: "https://linkedin.com/company/techcorp",
        website: "https://techcorp.com",
        employees: 750,
        founded: 2010,
        revenue: "$50M - $100M",
        buyingSignals: {
          score: 85,
          signals: [
            "45 new job postings in last 30 days",
            "Recently hired VP of People Operations",
            "Expanding engineering team by 200%"
          ]
        },
        keyContacts: [
          {
            name: "Sarah Johnson",
            title: "VP of People Operations",
            linkedin: "https://linkedin.com/in/sarah-johnson",
            email: "sarah.johnson@techcorp.com"
          },
          {
            name: "Mike Chen",
            title: "Head of Engineering",
            linkedin: "https://linkedin.com/in/mike-chen",
            email: "mike.chen@techcorp.com"
          }
        ]
      },
      {
        id: 2,
        name: "GrowthStart",
        domain: "growthstart.io",
        industry: "SaaS",
        size: "100-500",
        location: "Austin, TX",
        description: "Fast-growing startup building next-generation productivity tools",
        linkedin: "https://linkedin.com/company/growthstart",
        website: "https://growthstart.io",
        employees: 280,
        founded: 2018,
        revenue: "$10M - $50M",
        buyingSignals: {
          score: 92,
          signals: [
            "Just raised Series B funding",
            "New CPO hired from major tech company",
            "Planning to triple team size"
          ]
        },
        keyContacts: [
          {
            name: "Michael Chen",
            title: "Chief People Officer",
            linkedin: "https://linkedin.com/in/michael-chen",
            email: "m.chen@growthstart.io"
          },
          {
            name: "Lisa Park",
            title: "VP of Operations",
            linkedin: "https://linkedin.com/in/lisa-park",
            email: "lisa.park@growthstart.io"
          }
        ]
      },
      {
        id: 3,
        name: "FinanceFlow",
        domain: "financeflow.com",
        industry: "Financial Services",
        size: "1000+",
        location: "New York, NY",
        description: "Enterprise financial technology platform serving Fortune 500 companies",
        linkedin: "https://linkedin.com/company/financeflow",
        website: "https://financeflow.com",
        employees: 1200,
        founded: 2005,
        revenue: "$100M+",
        buyingSignals: {
          score: 98,
          signals: [
            "$2.5M budget approved for talent acquisition tech",
            "Urgent hiring initiative for Q1",
            "Procurement process already started"
          ]
        },
        keyContacts: [
          {
            name: "Emily Rodriguez",
            title: "Director of Talent Acquisition",
            linkedin: "https://linkedin.com/in/emily-rodriguez",
            email: "emily.r@financeflow.com"
          },
          {
            name: "David Kim",
            title: "Chief Technology Officer",
            linkedin: "https://linkedin.com/in/david-kim",
            email: "david.kim@financeflow.com"
          }
        ]
      }
    ]

    // Filter companies based on query
    const filteredCompanies = mockCompanies.filter(company => 
      company.name.toLowerCase().includes(query.toLowerCase()) ||
      company.domain.toLowerCase().includes(query.toLowerCase()) ||
      company.industry.toLowerCase().includes(query.toLowerCase())
    )

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      data: {
        companies: filteredCompanies,
        total: filteredCompanies.length,
        query: query
      }
    })

  } catch (error) {
    console.error('Company search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}