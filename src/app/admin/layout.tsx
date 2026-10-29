import { Suspense } from "react"

import { AdminNavigation, AdminSidebar } from "@/components/admin/admin-sidebar"
import { CommandMenu } from "@/components/admin/command-menu"
import { NavUser } from "@/components/admin/nav-user"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/toast"
import { getCurrentUser } from "@/lib/auth/current-user"
import { getPrivileges } from "@/lib/auth/privileges"

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Toaster>
      <SidebarProvider>
        <AdminSidebar
          navigation={
            <Suspense fallback={<AdminNavigation privileges={[]} />}>
              <CurrentNavigation />
            </Suspense>
          }
          footer={
            <Suspense fallback={<Skeleton className="h-12" />}>
              <CurrentNavUser />
            </Suspense>
          }
        />
        <SidebarInset>
          <header className="sticky top-0 flex h-14 shrink-0 items-center gap-3 rounded-t-xl border-b bg-background/80 px-4 backdrop-blur-md">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="data-vertical:h-4 data-vertical:self-auto" />
            <Suspense fallback={<CommandMenu privileges={[]} />}>
              <CurrentCommandMenu />
            </Suspense>
          </header>
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </Toaster>
  )
}

async function CurrentNavUser() {
  const user = await getCurrentUser()
  return <NavUser user={user} />
}

async function CurrentNavigation() {
  const user = await getCurrentUser()
  return <AdminNavigation privileges={getPrivileges(user)} />
}

async function CurrentCommandMenu() {
  const user = await getCurrentUser()
  return <CommandMenu privileges={getPrivileges(user)} />
}
