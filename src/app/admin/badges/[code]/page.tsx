import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { BadgeForm } from "@/components/admin/badges/badge-form"
import { PageHeader } from "@/components/admin/page-header"
import { TableSkeleton } from "@/components/admin/table-states"
import { getBadge } from "@/lib/admin/badges/api"
import { BADGES_PATH } from "@/lib/admin/badges/model"

export const metadata: Metadata = { title: "Изменение значка" }

export default function EditBadgePage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <EditBadgeForm params={params} />
    </Suspense>
  )
}

async function EditBadgeForm({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const result = await getBadge(code)
  if (!result.ok && result.error.code === "BADGE_NOT_FOUND") redirect(BADGES_PATH)
  return (
    <>
      <PageHeader title="Изменение значка" />
      {result.ok ? (
        <BadgeForm key={result.data.code} badge={result.data} />
      ) : (
        <ApiErrorAlert error={result.error} />
      )}
    </>
  )
}
