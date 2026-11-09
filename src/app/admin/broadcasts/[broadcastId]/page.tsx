import type { Metadata } from "next"
import { Suspense } from "react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { BroadcastView } from "@/components/admin/broadcast-view"
import { Skeleton } from "@/components/ui/skeleton"
import { adminGet } from "@/lib/admin/api"
import type { Broadcast } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Рассылка" }

export default function BroadcastPage({ params }: PageProps<"/admin/broadcasts/[broadcastId]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <LoadedBroadcast params={params} />
    </Suspense>
  )
}

async function LoadedBroadcast({ params }: { params: Promise<{ broadcastId: string }> }) {
  const { broadcastId } = await params
  const result = await adminGet<Broadcast>(`/admin/broadcasts/${encodeURIComponent(broadcastId)}`)
  if (!result.ok) return <ApiErrorAlert error={result.error} forbiddenHint="Перелогиньтесь, чтобы обновить права" />
  return <BroadcastView initial={result.data} />
}
