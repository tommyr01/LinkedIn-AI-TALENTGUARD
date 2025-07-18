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
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">TalentGuard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}