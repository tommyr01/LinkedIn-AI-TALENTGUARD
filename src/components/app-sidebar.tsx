"use client"

import * as React from "react"
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
} from "@tabler/icons-react"

import Link from "next/link"
import { usePathname } from "next/navigation"

const data = {
  user: {
    name: "TalentGuard User",
    email: "user@talentguard.com",
    avatar: "/avatars/01.png",
  },
  navMain: [
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
      visible: true, // Changed to true to make it visible again
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
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
      visible: true,
    },
  ],
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 h-full border-r bg-background flex flex-col">
      <div className="border-b px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <IconInnerShadowTop className="h-5 w-5" />
          <span className="text-base font-semibold">TalentGuard</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {data.navMain
            .filter(item => item.visible)
            .map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.url
            return (
              <li key={item.url}>
                <Link
                  href={item.url}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="border-t px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="flex-1">
            <p className="text-sm font-medium">{data.user.name}</p>
            <p className="text-xs text-muted-foreground">{data.user.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}