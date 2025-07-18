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
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-semibold">TalentGuard</h1>
      </div>
      
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive && "bg-gray-200"
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.name}
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