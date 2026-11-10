import type { Metadata } from "next"
import { Suspense } from "react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { BadgeForm } from "@/components/admin/badges/badge-form"
import { PageHeader } from "@/components/admin/page-header"
import { TableSkeleton } from "@/components/admin/table-states"
import { getBadgeMetrics } from "@/lib/admin/badges/api"

export const metadata: Metadata = { title: "Новый значок" }

export default function NewBadgePage() {
  return (
    <>
      <PageHeader title="Новый значок" description="Выберите, за какое достижение выдавать значок." />
      <Suspense fallback={<TableSkeleton />}>
        <NewBadgeForm />
      </Suspense>
    </>
  )
}

async function NewBadgeForm() {
  const result = await getBadgeMetrics()
  return result.ok ? <BadgeForm metrics={result.data} /> : <ApiErrorAlert error={result.error} />
}
