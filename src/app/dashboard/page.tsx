import { CompanySearch } from '@/components/company-search'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Users, Building2, Target } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Modern header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Welcome to TalentGuard
        </h1>
        <p className="text-lg text-gray-600">
          Find and enrich buying committee members for your target companies
        </p>
      </div>
      
      {/* Modern stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">0</div>
            <p className="text-sm text-blue-600">+0% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contacts Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">0</div>
            <p className="text-sm text-green-600">+0% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-violet-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">0</div>
            <p className="text-sm text-purple-600">+0% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-amber-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <Target className="h-4 w-4" />
              High Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">0</div>
            <p className="text-sm text-orange-600">+0% from last month</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Search section */}
      <CompanySearch />
    </div>
  )
}