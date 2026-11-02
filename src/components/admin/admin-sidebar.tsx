"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PawPrintIcon } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getNavigation, isActive } from "@/lib/admin/navigation"
import type { Privilege } from "@/lib/auth/privileges"

export function AdminSidebar({ navigation, footer }: { navigation: React.ReactNode; footer: React.ReactNode }) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/admin" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                <PawPrintIcon />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">ЛапаРядом</span>
                <span className="truncate text-xs text-muted-foreground">Администрирование</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>{navigation}</SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>{footer}</SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

type Badges = Record<string, number>

export function AdminNavigation({ privileges, badges = {} }: { privileges: Privilege[]; badges?: Badges }) {
  return (
    <Suspense fallback={<Navigation privileges={privileges} badges={badges} pathname={null} />}>
      <ActiveNavigation privileges={privileges} badges={badges} />
    </Suspense>
  )
}

function ActiveNavigation({ privileges, badges }: { privileges: Privilege[]; badges: Badges }) {
  return <Navigation privileges={privileges} badges={badges} pathname={usePathname()} />
}

function Navigation({
  privileges,
  badges,
  pathname,
}: {
  privileges: Privilege[]
  badges: Badges
  pathname: string | null
}) {
  return getNavigation(privileges).map((group, index) => (
    <SidebarGroup key={index}>
      {group.title && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                isActive={isActive(pathname, item.href)}
                tooltip={item.title}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
              {badges[item.href] && <SidebarMenuBadge>{badges[item.href]}</SidebarMenuBadge>}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ))
}
