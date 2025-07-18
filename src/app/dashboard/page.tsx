import { SectionCards } from '@/components/section-cards'
import { CompanySearch } from '@/components/company-search'
import { Button } from '@/components/ui/button'
import { IconRefresh, IconDownload } from '@tabler/icons-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to TalentGuard Buyer Intelligence
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <IconDownload className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <SectionCards />
      
      {/* Company Search */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Company Search</h2>
        <CompanySearch />
      </div>
    </div>
  )
}