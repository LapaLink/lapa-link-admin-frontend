"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { DataTable } from "@/components/admin/data-table"
import { NoResults } from "@/components/admin/table-states"
import { Skeleton } from "@/components/ui/skeleton"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getCaseHistory } from "@/lib/admin/actions"
import { formatDateTime } from "@/lib/admin/format"
import { STATUS_HISTORY_STATUS_LABELS, STATUS_HISTORY_TARGET_LABELS } from "@/lib/admin/labels"
import type { StatusHistoryItem } from "@/lib/api/admin-types"
import type { ApiResult } from "@/lib/api/types"

const ALL = "ALL"

/** "Объявление" and "История" tabs; the history panel mounts, and so loads, only when its tab is opened. */
export function CaseTabs({ history, children }: { history: React.ReactNode; children: React.ReactNode }) {
  return (
    <Tabs defaultValue="details" className="gap-4">
      <TabsList>
        <TabsTrigger value="details">Объявление</TabsTrigger>
        <TabsTrigger value="history">История</TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="flex flex-col gap-4">
        {children}
      </TabsContent>
      <TabsContent value="history">{history}</TabsContent>
    </Tabs>
  )
}

/** Status history of a case, requested once when the component mounts. */
export function CaseHistory({
  caseId,
  authorId,
  needs,
  canReadUsers,
}: {
  caseId: string
  authorId: string
  needs: { id: string; type: string }[]
  canReadUsers: boolean
}) {
  const [result, setResult] = useState<ApiResult<StatusHistoryItem[]>>()
  const [filter, setFilter] = useState(ALL)
  // Keeps the Strict Mode double effect from requesting the history twice.
  const requested = useRef(false)

  useEffect(() => {
    if (requested.current) return
    requested.current = true
    getCaseHistory(caseId).then(setResult)
  }, [caseId])

  if (!result) return <Skeleton className="h-64" />
  if (!result.ok) {
    return result.error.code === "CASE_NOT_FOUND" ? (
      <NoResults description="Объявление недоступно (черновик или удалено)" />
    ) : (
      <ApiErrorAlert error={result.error} />
    )
  }
  if (result.data.length === 0) return <NoResults description="Событий пока нет" />

  const types = [...new Set(result.data.map((item) => item.targetType))]
  const items = filter === ALL ? result.data : result.data.filter((item) => item.targetType === filter)

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        value={[filter]}
        onValueChange={(value) => value[0] && setFilter(value[0])}
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem value={ALL}>Все</ToggleGroupItem>
        {types.map((type) => (
          <ToggleGroupItem key={type} value={type}>
            {STATUS_HISTORY_TARGET_LABELS[type] ?? type}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Время</TableHead>
            <TableHead>Объект</TableHead>
            <TableHead>Переход</TableHead>
            <TableHead>Кто</TableHead>
            <TableHead>Причина</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const statuses = STATUS_HISTORY_STATUS_LABELS[item.targetType] ?? {}
            const need = item.targetType === "NEED" ? needs.find((entry) => entry.id === item.needId) : undefined
            return (
              <TableRow key={item.id}>
                <TableCell className="tabular-nums">{formatDateTime(item.createdAt)}</TableCell>
                <TableCell>
                  {item.targetType === "NEED"
                    ? `Потребность «${need?.type ?? item.needId ?? item.targetId}»`
                    : (STATUS_HISTORY_TARGET_LABELS[item.targetType] ?? item.targetType)}
                </TableCell>
                <TableCell>
                  {item.fromStatus === null ? "создано" : (statuses[item.fromStatus] ?? item.fromStatus)}
                  {" → "}
                  {statuses[item.toStatus] ?? item.toStatus}
                </TableCell>
                <TableCell>
                  {item.actorId === null ? (
                    "Система"
                  ) : (
                    <span className="flex flex-wrap items-center gap-1">
                      {canReadUsers ? (
                        <Link
                          href={`/admin/users/${item.actorId}/cases`}
                          className="font-mono text-xs underline-offset-4 hover:underline"
                        >
                          {item.actorId}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs">{item.actorId}</span>
                      )}
                      {item.actorId === authorId && <span className="text-xs text-muted-foreground">автор</span>}
                    </span>
                  )}
                </TableCell>
                <TableCell className="max-w-80 whitespace-pre-line">{item.reason ?? "—"}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </DataTable>
    </div>
  )
}
