import type { Metadata } from "next"
import { Suspense } from "react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { DataTable } from "@/components/admin/data-table"
import { LimitDialog } from "@/components/admin/limit-dialog"
import { LimitRowActions } from "@/components/admin/limit-row-actions"
import { PageHeader } from "@/components/admin/page-header"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
import { Badge } from "@/components/ui/badge"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { adminGet } from "@/lib/admin/api"
import { describeLimit } from "@/lib/admin/limits"
import { LIMIT_BAN_TYPE_LABELS, LIMIT_TYPES_NOT_ENFORCED, LIMIT_TYPE_LABELS } from "@/lib/admin/labels"
import type { OperationLimit } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Лимиты" }

export default function LimitsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <LimitsTable />
    </Suspense>
  )
}

async function LimitsTable() {
  const result = await adminGet<OperationLimit[]>("/admin/limits")
  const existing = result.ok ? result.data.map((limit) => limit.limitType) : []

  return (
    <>
      <PageHeader
        title="Лимиты"
        description="Сколько раз пользователь может выполнить операцию за окно времени и что будет при превышении"
      >
        <LimitDialog existing={existing} />
      </PageHeader>
      {!result.ok ? (
        <ApiErrorAlert error={result.error} />
      ) : result.data.length === 0 ? (
        <NoResults description="Добавьте первое правило" />
      ) : (
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>Операция</TableHead>
              <TableHead>Правило</TableHead>
              <TableHead>Бан</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((limit) => (
              <TableRow key={limit.limitType} className={limit.enabled ? undefined : "opacity-60"}>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    {LIMIT_TYPE_LABELS[limit.limitType] ?? limit.limitType}
                    {!limit.enabled && <Badge variant="outline">Выключено</Badge>}
                    {LIMIT_TYPES_NOT_ENFORCED.includes(limit.limitType) && (
                      <Badge variant="outline">пока не действует</Badge>
                    )}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{limit.limitType}</div>
                  {limit.description && (
                    <div className="max-w-72 whitespace-pre-line text-xs text-muted-foreground">{limit.description}</div>
                  )}
                </TableCell>
                <TableCell className="max-w-96 whitespace-normal">{describeLimit(limit)}</TableCell>
                <TableCell>{LIMIT_BAN_TYPE_LABELS[limit.limitBanType] ?? limit.limitBanType}</TableCell>
                <TableCell className="text-right">
                  <LimitRowActions limit={limit} existing={existing} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
    </>
  )
}
