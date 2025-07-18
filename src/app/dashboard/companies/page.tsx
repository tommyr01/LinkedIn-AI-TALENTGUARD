import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  IconBuilding, 
  IconUsers, 
  IconMapPin, 
  IconTrendingUp,
  IconSearch,
  IconFilter,
  IconExternalLink,
  IconStar,
  IconClock,
  IconTarget
} from '@tabler/icons-react'

export default function CompaniesPage() {
  const companies = [
    {
      id: 1,
      name: "TechCorp Inc.",
      logo: "/api/placeholder/80/80",
      industry: "Technology",
      size: "500-1000",
      location: "San Francisco, CA",
      website: "www.techcorp.com",
      status: "Active",
      talentScore: 92,
      lastContact: "2 days ago",
      buyingCommittee: [
        { name: "Sarah Johnson", role: "VP People Ops", status: "Engaged" },
        { name: "Mike Chen", role: "HR Director", status: "New" },
        { name: "Lisa Park", role: "Talent Manager", status: "Engaged" }
      ],
      signals: 8,
      notes: "Strong interest in talent analytics. Budget approved for Q1."
    },
    {
      id: 2,
      name: "FinanceFlow",
      logo: "/api/placeholder/80/80",
      industry: "Financial Services",
      size: "1000+",
      location: "New York, NY",
      website: "www.financeflow.com",
      status: "Hot Lead",
      talentScore: 88,
      lastContact: "1 day ago",
      buyingCommittee: [
        { name: "Emily Rodriguez", role: "Director TA", status: "Champion" },
        { name: "Tom Wilson", role: "CPO", status: "Engaged" },
        { name: "Anna Lee", role: "VP HR", status: "New" }
      ],
      signals: 12,
      notes: "Urgent need for talent intelligence platform. Decision by end of month."
    },
    {
      id: 3,
      name: "HealthTech Solutions",
      logo: "/api/placeholder/80/80",
      industry: "Healthcare",
      size: "200-500",
      location: "Boston, MA",
      website: "www.healthtechsol.com",
      status: "Nurturing",
      talentScore: 78,
      lastContact: "1 week ago",
      buyingCommittee: [
        { name: "David Kim", role: "CHRO", status: "New" },
        { name: "Rachel Green", role: "Recruiting Lead", status: "Engaged" }
      ],
      signals: 5,
      notes: "Growing rapidly. Interested in scaling their talent acquisition."
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your target company pipeline
          </p>
        </div>
        <Button>
          Add Company
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Companies</p>
                <p className="text-2xl font-bold">48</p>
              </div>
              <IconBuilding className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hot Leads</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <IconTrendingUp className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Contacts</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <IconUsers className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">86</p>
              </div>
              <IconTarget className="h-8 w-8 text-muted-foreground" />
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
                placeholder="Search companies..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <IconFilter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      <div className="space-y-4">
        {companies.map((company) => (
          <Card key={company.id}>
            <CardContent className="p-6">
              <div className="grid grid-cols-12 gap-6">
                {/* Company Info */}
                <div className="col-span-12 lg:col-span-5 flex items-start gap-4">
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                    <IconBuilding className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold">{company.name}</h3>
                      <Badge variant={
                        company.status === 'Hot Lead' ? 'destructive' :
                        company.status === 'Active' ? 'default' :
                        'secondary'
                      }>
                        {company.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{company.industry}</span>
                      <span>•</span>
                      <span>{company.size} employees</span>
                      <span>•</span>
                      <span>{company.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <IconExternalLink className="h-4 w-4" />
                      <a href="#" className="text-primary hover:underline">{company.website}</a>
                    </div>
                  </div>
                </div>

                {/* Buying Committee */}
                <div className="col-span-12 lg:col-span-4 space-y-2">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Buying Committee ({company.buyingCommittee.length})
                  </div>
                  <div className="space-y-1">
                    {company.buyingCommittee.map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{member.name}</span>
                          <span className="text-muted-foreground"> • {member.role}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {member.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="col-span-12 lg:col-span-3 flex flex-col items-end justify-between">
                  <div className="text-right space-y-2">
                    <div>
                      <div className="text-2xl font-bold">{company.talentScore}</div>
                      <div className="text-xs text-muted-foreground">TalentGuard Score</div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <IconTrendingUp className="h-4 w-4" />
                        <span>{company.signals} signals</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconClock className="h-4 w-4" />
                        <span>{company.lastContact}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm">View Details</Button>
                </div>
              </div>
              
              {/* Notes */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Latest: </span>
                  {company.notes}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}