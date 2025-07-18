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
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
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
    },
    {
      title: "Company Search",
      url: "/dashboard/search",
      icon: IconSearch,
    },
    {
      title: "Contacts",
      url: "/dashboard/contacts",
      icon: IconUsers,
    },
    {
      title: "Companies",
      url: "/dashboard/companies",
      icon: IconBuilding,
    },
    {
      title: "Signals",
      url: "/dashboard/signals",
      icon: IconTarget,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar 
      collapsible="offcanvas" 
      className="w-64 border-r"
      {...props}
    >
      <SidebarHeader className="border-b px-4 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="w-full justify-start gap-2 px-2 py-1.5 hover:bg-transparent"
            >
              <Link href="/dashboard">
                <IconInnerShadowTop className="h-5 w-5" />
                <span className="text-base font-semibold">TalentGuard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-3 py-2">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t px-3 py-3">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}