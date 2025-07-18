import { CompanySearch } from '@/components/company-search'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">TalentGuard Buyer Intelligence</h1>
        <p className="text-muted-foreground">
          Find and enrich buying committee members for your target companies
        </p>
      </div>
      
      <CompanySearch />
    </div>
  )
}