import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { PageHeader } from "@/components/admin/page-header"
import { UserProfile } from "@/components/admin/user-profile"
import { UserTabs } from "@/components/admin/user-tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { adminGet } from "@/lib/admin/api"
import type { AdminUserDetails, CityGroup } from "@/lib/api/admin-types"
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
  const privileges = getPrivileges(user)
  // The profile holds personal data, so it is requested only with USER_READ.
  const details = privileges.includes("USER_READ")
    ? await adminGet<AdminUserDetails>(`/admin/users/${encodeURIComponent(userId)}`)
    : undefined
  const cityCode = details?.ok ? details.data.cityCode : null
  const cities = cityCode ? await adminGet<CityGroup[]>("/cities") : undefined
  const cityName = cities?.ok
    ? (cities.data.flatMap((group) => group.cities).find((city) => city.code === cityCode)?.nameRu ?? null)
    : null

  return (
    <>
      <PageHeader
        title="Пользователь"
        description={<span className="font-mono">{userId}</span>}
      />
      {details && (details.ok ? <UserProfile user={details.data} cityName={cityName} /> : <ApiErrorAlert error={details.error} />)}
      <UserTabs userId={userId} privileges={privileges} />
    </>
  )
}
