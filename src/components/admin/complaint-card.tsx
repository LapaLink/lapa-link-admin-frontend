"use client"

import { useState, useTransition } from "react"
import Link from "next/link"

import { ComplaintActions } from "@/components/admin/complaint-actions"
import { PageHeader } from "@/components/admin/page-header"
import { ComplaintStatusBadge } from "@/components/admin/status-badges"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { getComplaint } from "@/lib/admin/actions"
import { formatDateTime } from "@/lib/admin/format"
import { COMPLAINT_RESOLUTION_LABELS, COMPLAINT_TARGET_LABELS } from "@/lib/admin/labels"
import type { AdminComplaint } from "@/lib/api/admin-types"

/**
 * Complaint card. Decisions update it from the API response, and a conflict reloads only the complaint:
 * the route is never refreshed, because re-rendering it would request the target again and every
 * target request is written to the audit log.
 */
export function ComplaintCard({
  initial,
  targetMissing,
  children,
}: {
  initial: AdminComplaint
  targetMissing: boolean
  children: React.ReactNode
}) {
  const [complaint, setComplaint] = useState(initial)
  const [reloading, startReload] = useTransition()
  const open = complaint.status === "NEW" || complaint.status === "IN_PROGRESS"

  function reload() {
    startReload(async () => {
      const result = await getComplaint(complaint.id)
      if (!result.ok) {
        toast.add({ title: "Не удалось обновить жалобу", description: result.error.message, type: "error" })
        return
      }
      setComplaint(result.data)
    })
  }

  return (
    <>
      <PageHeader
        title={`Жалоба: ${COMPLAINT_TARGET_LABELS[complaint.targetType] ?? complaint.targetType}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ComplaintStatusBadge status={complaint.status} />
            <span>Подана {formatDateTime(complaint.createdAt)}</span>
            {reloading && <Spinner />}
          </span>
        }
      >
        {open && (
          <ComplaintActions
            complaint={complaint}
            targetMissing={targetMissing}
            onUpdate={setComplaint}
            onReload={reload}
          />
        )}
      </PageHeader>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">{children}</div>
        <Card>
          <CardHeader>
            <CardTitle>Жалоба</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="whitespace-pre-line">{complaint.message}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Автор</dt>
              <dd>
                <Link
                  href={`/admin/users/${complaint.reporterId}/cases`}
                  className="font-mono text-xs break-all underline-offset-4 hover:underline"
                >
                  {complaint.reporterId}
                </Link>
              </dd>
              <dt className="text-muted-foreground">Решение</dt>
              <dd>
                {complaint.resolution
                  ? (COMPLAINT_RESOLUTION_LABELS[complaint.resolution] ?? complaint.resolution)
                  : "—"}
              </dd>
              <dt className="text-muted-foreground">Комментарий</dt>
              <dd className="whitespace-pre-line">{complaint.moderatorComment ?? "—"}</dd>
              <dt className="text-muted-foreground">Модератор</dt>
              <dd className="font-mono text-xs break-all">{complaint.moderatedBy ?? "—"}</dd>
              <dt className="text-muted-foreground">Рассмотрена</dt>
              <dd>{formatDateTime(complaint.moderatedAt)}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
