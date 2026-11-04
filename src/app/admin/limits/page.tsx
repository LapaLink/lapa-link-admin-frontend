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
import { AUDIT_ACTION_LABELS, LIMIT_BAN_TYPE_LABELS } from "@/lib/admin/labels"
import { AUDIT_ACTIONS, type OperationLimit } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Лимиты" }

export default function LimitsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <LimitsTable />
    </Suspense>
  )
}

async function LimitsTable() {
  const [result, dictionary] = await Promise.all([
    adminGet<OperationLimit[]>("/admin/limits"),
    adminGet<{ auditActions?: string[] }>("/dictionary"),
  ])
  const limits = result.ok ? result.data : []
  const auditActions = dictionary.ok && dictionary.data.auditActions ? dictionary.data.auditActions : [...AUDIT_ACTIONS]

  return (
    <>
      <PageHeader
        title="Лимиты"
        description="Сколько раз пользователь может выполнить операцию за окно времени и что будет при превышении"
      >
        <LimitDialog limits={limits} auditActions={auditActions} />
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
                    <span className="font-mono text-xs">{limit.limitType}</span>
                    {!limit.enabled && <Badge variant="outline">Выключено</Badge>}
                  </div>
                  {limit.description && (
                    <div className="max-w-72 whitespace-pre-line text-xs text-muted-foreground">{limit.description}</div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {(AUDIT_ACTION_LABELS as Record<string, string>)[limit.auditAction] ?? limit.auditAction}
                  </div>
                </TableCell>
                <TableCell className="max-w-96 whitespace-normal">{describeLimit(limit)}</TableCell>
                <TableCell>{LIMIT_BAN_TYPE_LABELS[limit.limitBanType] ?? limit.limitBanType}</TableCell>
                <TableCell className="text-right">
                  <LimitRowActions limit={limit} limits={limits} auditActions={auditActions} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
    </>
  )
}
