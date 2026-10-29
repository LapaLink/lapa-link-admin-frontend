import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"

import { PageHeader } from "@/components/admin/page-header"
import { UserTabs } from "@/components/admin/user-tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/auth/current-user"
import { getPrivileges } from "@/lib/auth/privileges"

export default function UserLayout({ children, params }: LayoutProps<"/admin/users/[userId]">) {
  return (
    <>
      <div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/users" />}>
          <ArrowLeftIcon data-icon="inline-start" />
          Все пользователи
        </Button>
      </div>
      <Suspense fallback={<Skeleton className="h-16 w-96" />}>
        <UserHeader params={params} />
      </Suspense>
      {children}
    </>
  )
}

async function UserHeader({ params }: Pick<LayoutProps<"/admin/users/[userId]">, "params">) {
  const [{ userId }, user] = await Promise.all([params, getCurrentUser()])

  return (
    <>
      <PageHeader
        title="Пользователь"
        description={<span className="font-mono">{userId}</span>}
      />
      <UserTabs userId={userId} privileges={getPrivileges(user)} />
    </>
  )
}
