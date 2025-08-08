"use client"

import { useState, useEffect } from 'react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  IconChartBar,
  IconDashboard,
  IconSearch,
  IconUsers,
  IconBuilding,
  IconTarget,
  IconSettings,
  IconInnerShadowTop,
  IconBrandLinkedin,
  IconChartDots3,
  IconNetwork,
  IconBrain,
  IconMenu2,
  IconX,
} from "@tabler/icons-react"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
    visible: true,
  },
  {
    title: "Company Search",
    url: "/dashboard/search",
    icon: IconSearch,
    visible: true,
  },
  {
    title: "Contacts",
    url: "/dashboard/contacts",
    icon: IconUsers,
    visible: true,
  },
  {
    title: "Companies",
    url: "/dashboard/companies",
    icon: IconBuilding,
    visible: true,
  },
  {
    title: "Signals",
    url: "/dashboard/signals",
    icon: IconTarget,
    visible: true,
  },
  {
    title: "LinkedIn Connections",
    url: "/dashboard/connections",
    icon: IconNetwork,
    visible: true,
  },
  {
    title: "LinkedIn Content",
    url: "/dashboard/linkedin/my-posts",
    icon: IconBrandLinkedin,
    visible: true,
  },
  {
    title: "LinkedIn Prospects",
    url: "/dashboard/linkedin/prospects",
    icon: IconChartDots3,
    visible: true,
  },
  {
    title: "Connection Intelligence",
    url: "/dashboard/intelligence",
    icon: IconBrain,
    visible: true,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: IconSettings,
    visible: true,
  },
]

interface SidebarContentProps {
  pathname: string
  onItemClick?: () => void
  className?: string
}

function SidebarContent({ pathname, onItemClick, className = "" }: SidebarContentProps) {
  return (
    <div className={`h-full border-r bg-background flex flex-col ${className}`}>
      {/* Logo/Brand */}
      <div className="border-b px-4 py-3">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
          onClick={onItemClick}
        >
          <IconInnerShadowTop className="h-5 w-5" />
          <span className="text-base font-semibold">TalentGuard</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2" role="navigation" aria-label="Main navigation">
        <ul className="space-y-1">
          {navigationItems
            .filter(item => item.visible)
            .map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.url
            return (
              <li key={item.url}>
                <Link
                  href={item.url}
                  onClick={onItemClick}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted focus:bg-muted'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-medium">TG</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">TalentGuard User</p>
            <p className="text-xs text-muted-foreground truncate">user@talentguard.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ResponsiveSidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Close mobile menu on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Link href="/dashboard" className="flex items-center gap-2">
            <IconInnerShadowTop className="h-5 w-5" />
            <span className="font-semibold">TalentGuard</span>
          </Link>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                aria-label="Open navigation menu"
              >
                <IconMenu2 className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="p-0 w-72"
              aria-describedby="mobile-nav-description"
            >
              <div id="mobile-nav-description" className="sr-only">
                Main navigation menu
              </div>
              <SidebarContent 
                pathname={pathname} 
                onItemClick={() => setIsOpen(false)}
                className="w-full border-r-0"
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile content offset */}
        <div className="h-14" />
      </>
    )
  }

  // Desktop sidebar
  return (
    <div className="w-64 h-full">
      <SidebarContent pathname={pathname} />
    </div>
  )
}