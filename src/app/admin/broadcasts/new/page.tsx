import type { Metadata } from "next"
import { Suspense } from "react"

import { BroadcastForm } from "@/components/admin/broadcast-form"
import { PageHeader } from "@/components/admin/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/auth/current-user"
import { getPrivileges } from "@/lib/auth/privileges"

export const metadata: Metadata = { title: "Новая рассылка" }

export default function NewBroadcastPage() {
  return (
    <>
      <PageHeader title="Новая рассылка" description="Рассылка уходит в фоне, статистику можно смотреть на её странице" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Form />
      </Suspense>
    </>
  )
}

async function Form() {
  const user = await getCurrentUser()
  return <BroadcastForm canSearchUsers={getPrivileges(user).includes("USER_READ")} />
}
