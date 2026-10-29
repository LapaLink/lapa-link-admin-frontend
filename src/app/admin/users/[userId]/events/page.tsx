import type { Metadata } from "next"
import { Suspense } from "react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { DataTable } from "@/components/admin/data-table"
import { EventDetails } from "@/components/admin/event-details"
import { FilterForm } from "@/components/admin/filter-form"
import { TablePagination } from "@/components/admin/table-pagination"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
import { Badge } from "@/components/ui/badge"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { adminGet } from "@/lib/admin/api"
import {
  formatDateTime,
  localDateTimeDaysAgo,
  localDateTimeToInstant,
  pickParams,
  type SearchParams,
} from "@/lib/admin/format"
import { AUDIT_ACTION_LABELS, ROLE_LABELS } from "@/lib/admin/labels"
import { AUDIT_ACTIONS, type AuditLogEntry, type Page } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "События пользователя" }

const PARAMS = ["action", "outcome", "from", "to", "size", "page"] as const

// The backend deletes audit log entries older than this on a schedule.
const RETENTION_DAYS = 30

export default function UserEventsPage({ params, searchParams }: PageProps<"/admin/users/[userId]/events">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <UserEvents params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function UserEvents({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<SearchParams>
}) {
  const { userId } = await params
  const query = pickParams(await searchParams, PARAMS)
  const minFrom = localDateTimeDaysAgo(RETENTION_DAYS)
  const result = await adminGet<Page<AuditLogEntry>>(`/admin/users/${userId}/events`, {
    ...query,
    from: localDateTimeToInstant(query.from),
    to: localDateTimeToInstant(query.to),
  })

  return (
    <>
      <FilterForm key={JSON.stringify(query)} resetHref={`/admin/users/${userId}/events`}>
        <Field className="w-auto">
          <FieldLabel htmlFor="action">Действие</FieldLabel>
          <NativeSelect id="action" name="action" defaultValue={query.action ?? ""}>
            <NativeSelectOption value="">Все</NativeSelectOption>
            {AUDIT_ACTIONS.map((action) => (
              <NativeSelectOption key={action} value={action}>
                {AUDIT_ACTION_LABELS[action] ?? action}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field className="w-auto">
          <FieldLabel htmlFor="outcome">Результат</FieldLabel>
          <NativeSelect id="outcome" name="outcome" defaultValue={query.outcome ?? ""}>
            <NativeSelectOption value="">Любой</NativeSelectOption>
            <NativeSelectOption value="SUCCESS">Успех</NativeSelectOption>
            <NativeSelectOption value="FAILURE">Ошибка</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field className="w-auto">
          <FieldLabel htmlFor="from">С (включительно)</FieldLabel>
          <Input id="from" name="from" type="datetime-local" min={minFrom} defaultValue={query.from} />
          <FieldDescription>Журнал хранит события за последние {RETENTION_DAYS} дней</FieldDescription>
        </Field>
        <Field className="w-auto">
          <FieldLabel htmlFor="to">По (не включительно)</FieldLabel>
          <Input id="to" name="to" type="datetime-local" defaultValue={query.to} />
        </Field>
      </FilterForm>
      {!result.ok ? (
        <ApiErrorAlert error={result.error} />
      ) : result.data.content.length === 0 ? (
        <NoResults description="Событий за выбранный период нет" />
      ) : (
        <>
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Время</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead>Результат</TableHead>
                <TableHead>Инициатор</TableHead>
                <TableHead>IP</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.content.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="tabular-nums">{formatDateTime(event.occurredAt)}</TableCell>
                  <TableCell>{AUDIT_ACTION_LABELS[event.action] ?? event.action}</TableCell>
                  <TableCell>
                    {event.outcome === "SUCCESS" ? (
                      <Badge variant="secondary">Успех</Badge>
                    ) : (
                      <Badge variant="destructive">{event.errorCode ?? "Ошибка"}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {event.actorType === "SYSTEM"
                      ? "Система"
                      : event.actorId === userId
                        ? "Сам пользователь"
                        : event.actorRole
                          ? ROLE_LABELS[event.actorRole]
                          : "Пользователь"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{event.ip ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <EventDetails event={event} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
          <TablePagination page={result.data} params={query} />
        </>
      )}
    </>
  )
}
