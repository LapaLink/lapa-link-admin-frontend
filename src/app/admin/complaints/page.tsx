import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowUpRightIcon } from "lucide-react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { ComplaintActions } from "@/components/admin/complaint-actions"
import { DataTable } from "@/components/admin/data-table"
import { FilterForm } from "@/components/admin/filter-form"
import { PageHeader } from "@/components/admin/page-header"
import { ComplaintStatusBadge } from "@/components/admin/status-badges"
import { TablePagination } from "@/components/admin/table-pagination"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { adminGet } from "@/lib/admin/api"
import { formatDateTime, pickParams, type SearchParams } from "@/lib/admin/format"
import {
  COMPLAINT_RESOLUTION_LABELS,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TARGET_LABELS,
} from "@/lib/admin/labels"
import type { AdminComplaint, Page } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Жалобы" }

const PARAMS = ["status", "targetType", "targetId", "size", "page"] as const

export default function ComplaintsPage({ searchParams }: PageProps<"/admin/complaints">) {
  return (
    <>
      <PageHeader
        title="Жалобы"
        description="Жалобы пользователей на объявления, других пользователей и чаты, сначала самые старые. Пока модератор не принял решение, объект жалобы остаётся как есть."
      />
      <Suspense fallback={<TableSkeleton />}>
        <Complaints searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function Complaints({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const query = pickParams(params, PARAMS)
  if (params.status === undefined) query.status = "NEW"
  const result = await adminGet<Page<AdminComplaint>>("/admin/complaints", query)

  return (
    <>
      <FilterForm key={JSON.stringify(query)} resetHref="/admin/complaints">
        <Field className="w-auto">
          <FieldLabel htmlFor="status">Статус</FieldLabel>
          <NativeSelect id="status" name="status" defaultValue={query.status ?? ""}>
            <NativeSelectOption value="">Все</NativeSelectOption>
            {Object.entries(COMPLAINT_STATUS_LABELS).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field className="w-auto">
          <FieldLabel htmlFor="targetType">Объект</FieldLabel>
          <NativeSelect id="targetType" name="targetType" defaultValue={query.targetType ?? ""}>
            <NativeSelectOption value="">Все</NativeSelectOption>
            {Object.entries(COMPLAINT_TARGET_LABELS).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        {query.targetId && <input type="hidden" name="targetId" value={query.targetId} />}
      </FilterForm>
      {!result.ok ? (
        <ApiErrorAlert error={result.error} />
      ) : result.data.content.length === 0 ? (
        <NoResults description="Жалоб с такими условиями нет" />
      ) : (
        <>
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Объект</TableHead>
                <TableHead>Жалоба</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Решение</TableHead>
                <TableHead>Создана</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.content.map((item) => {
                const open = item.status === "NEW" || item.status === "IN_PROGRESS"
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        href={
                          item.targetType === "CASE"
                            ? `/admin/moderation/${item.targetId}`
                            : item.targetType === "USER"
                              ? `/admin/users/${item.targetId}/cases`
                              : `/admin/complaints/${item.id}`
                        }
                        prefetch={item.targetType === "CASE" || item.targetType === "USER" ? null : false}
                        className="underline-offset-4 hover:underline"
                      >
                        {COMPLAINT_TARGET_LABELS[item.targetType] ?? item.targetType}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        от{" "}
                        <Link href={`/admin/users/${item.reporterId}/cases`} className="underline-offset-4 hover:underline">
                          автора жалобы
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-80 whitespace-pre-line">{item.message}</TableCell>
                    <TableCell>
                      <ComplaintStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="max-w-64 text-sm">
                      {item.resolution && <div>{COMPLAINT_RESOLUTION_LABELS[item.resolution] ?? item.resolution}</div>}
                      {item.moderatorComment && (
                        <div className="whitespace-pre-line text-muted-foreground">{item.moderatorComment}</div>
                      )}
                      {!item.resolution && !item.moderatorComment && "—"}
                    </TableCell>
                    <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={<Link href={`/admin/complaints/${item.id}`} prefetch={false} />}
                        >
                          <ArrowUpRightIcon data-icon="inline-start" />
                          Открыть
                        </Button>
                        {open && <ComplaintActions complaint={item} />}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </DataTable>
          <TablePagination page={result.data} params={query} />
        </>
      )}
    </>
  )
}
