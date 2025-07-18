"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Users, 
  Building2, 
  Target, 
  Settings,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Company Search', href: '/dashboard/search', icon: Search },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { name: 'Companies', href: '/dashboard/companies', icon: Building2 },
  { name: 'Signals', href: '/dashboard/signals', icon: Target },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200 shadow-sm">
      {/* Modern header */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Target className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            TalentGuard
          </h1>
        </div>
      </div>
      
      {/* Modern navigation */}
      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-11 px-3 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-r-2 border-blue-600" 
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn(
                      "mr-3 h-4 w-4",
                      isActive ? "text-blue-600" : "text-gray-500"
                    )} />
                    <span className="font-medium">{item.name}</span>
                  </Button>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}