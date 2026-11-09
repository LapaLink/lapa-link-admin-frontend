import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { DataTable } from "@/components/admin/data-table"
import { PageHeader } from "@/components/admin/page-header"
import { TablePagination } from "@/components/admin/table-pagination"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
import { Button } from "@/components/ui/button"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { adminGet } from "@/lib/admin/api"
import { formatDateTime, pickParams, type SearchParams } from "@/lib/admin/format"
import { BROADCAST_AUDIENCE_LABELS, BROADCAST_CHANNEL_LABELS } from "@/lib/admin/labels"
import type { Broadcast, Page } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Рассылки" }

const PARAMS = ["size", "page"] as const

const FORBIDDEN_HINT = "Перелогиньтесь, чтобы обновить права"

export default function BroadcastsPage({ searchParams }: PageProps<"/admin/broadcasts">) {
  return (
    <>
      <PageHeader title="Рассылки" description="История рассылок по SMS, email и в приложении, сначала новые">
        <Button nativeButton={false} render={<Link href="/admin/broadcasts/new" />}>
          <PlusIcon data-icon="inline-start" />
          Новая рассылка
        </Button>
      </PageHeader>
      <Suspense fallback={<TableSkeleton />}>
        <Broadcasts searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function Broadcasts({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = pickParams(await searchParams, PARAMS)
  const result = await adminGet<Page<Broadcast>>("/admin/broadcasts", { ...query, sort: "createdAt,desc" })
  if (!result.ok) return <ApiErrorAlert error={result.error} forbiddenHint={FORBIDDEN_HINT} />
  if (result.data.content.length === 0) return <NoResults description="Рассылок пока не было" />

  return (
    <>
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead>Канал</TableHead>
            <TableHead>Аудитория</TableHead>
            <TableHead>Заголовок</TableHead>
            <TableHead>Автор</TableHead>
            <TableHead>Доставлено / ошибки / пропущено / в очереди</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.data.content.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="tabular-nums">{formatDateTime(item.createdAt)}</TableCell>
              <TableCell>{BROADCAST_CHANNEL_LABELS[item.channel] ?? item.channel}</TableCell>
              <TableCell>{BROADCAST_AUDIENCE_LABELS[item.audience] ?? item.audience}</TableCell>
              <TableCell className="max-w-72 truncate">
                <Link href={`/admin/broadcasts/${item.id}`} className="underline-offset-4 hover:underline">
                  {item.title}
                </Link>
              </TableCell>
              <TableCell>{item.createdByName ?? "—"}</TableCell>
              <TableCell className="tabular-nums">
                {item.sent} / {item.failed} / {item.skipped} / {item.pending}
                <span className="text-muted-foreground"> из {item.totalRecipients}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
      <TablePagination page={result.data} params={query} />
    </>
  )
}
