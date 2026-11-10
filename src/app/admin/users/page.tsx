import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { DataTable } from "@/components/admin/data-table"
import { FilterForm } from "@/components/admin/filter-form"
import { ModeratorRoleButton } from "@/components/admin/moderator-role-button"
import { PageHeader } from "@/components/admin/page-header"
import { SortableHead } from "@/components/admin/sortable-head"
import { TablePagination } from "@/components/admin/table-pagination"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
import { UserBlockButton } from "@/components/admin/user-block-button"
import { UserStatusBadge } from "@/components/admin/status-badges"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel } from "@/components/ui/field"
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
import { formatDateTime, pickParams, type SearchParams } from "@/lib/admin/format"
import { ROLE_LABELS, USER_STATUS_LABELS } from "@/lib/admin/labels"
import type { AdminUser, Page } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Пользователи" }

const PARAMS = ["search", "status", "role", "sort", "size", "page"] as const

export default function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <>
      <PageHeader title="Пользователи" description="Поиск по email или имени, фильтры по статусу и роли" />
      <Suspense fallback={<TableSkeleton />}>
        <UsersContent searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function UsersContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = pickParams(await searchParams, PARAMS)
  const result = await adminGet<Page<AdminUser>>("/admin/users", params)
  // Sorting happens on the backend; roles are not sortable because they are a collection per user.
  const sortProps = { sort: params.sort, defaultSort: "createdAt,desc", basePath: "/admin/users", params }

  return (
    <>
      <FilterForm key={JSON.stringify(params)} resetHref="/admin/users">
        <Field className="w-64">
          <FieldLabel htmlFor="search">Поиск</FieldLabel>
          <Input id="search" name="search" defaultValue={params.search} placeholder="email или имя" />
        </Field>
        <Field className="w-auto">
          <FieldLabel htmlFor="status">Статус</FieldLabel>
          <NativeSelect id="status" name="status" defaultValue={params.status ?? ""}>
            <NativeSelectOption value="">Все</NativeSelectOption>
            {Object.entries(USER_STATUS_LABELS).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field className="w-auto">
          <FieldLabel htmlFor="role">Роль</FieldLabel>
          <NativeSelect id="role" name="role" defaultValue={params.role ?? ""}>
            <NativeSelectOption value="">Все</NativeSelectOption>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        {params.sort && <input type="hidden" name="sort" value={params.sort} />}
      </FilterForm>
      {!result.ok ? (
        <ApiErrorAlert error={result.error} />
      ) : result.data.content.length === 0 ? (
        <NoResults description="Измените условия поиска" />
      ) : (
        <>
          <DataTable>
            <TableHeader>
              <TableRow>
                <SortableHead field="displayName" label="Пользователь" {...sortProps} />
                <SortableHead field="status" label="Статус" {...sortProps} />
                <TableHead>Роли</TableHead>
                <SortableHead field="createdAt" label="Зарегистрирован" {...sortProps} />
                <SortableHead field="lastLoginAt" label="Последний вход" {...sortProps} />
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.content.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link
                      href={`/admin/users/${user.id}/cases`}
                      className="flex flex-col font-medium hover:underline"
                    >
                      {user.displayName ?? "Без имени"}
                      <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge status={user.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant={role === "USER" ? "outline" : "secondary"}>
                          {ROLE_LABELS[role]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(user.lastLoginAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <ModeratorRoleButton user={user} />
                      {user.status === "SUSPENDED" && (
                        <span className="text-xs text-muted-foreground">Блокировка снимется автоматически (досрочно — «Сбросить» во вкладке «Лимиты»)</span>
                      )}
                      {user.roles.every((role) => role === "USER") &&
                        (user.status === "ACTIVE" || user.status === "BLOCKED") && (
                          <UserBlockButton
                            userId={user.id}
                            name={user.displayName ?? user.email}
                            blocked={user.status === "BLOCKED"}
                          />
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
          <TablePagination page={result.data} params={params} />
        </>
      )}
    </>
  )
}
