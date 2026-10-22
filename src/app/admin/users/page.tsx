import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { DataTable } from "@/components/admin/data-table"
import { FilterForm } from "@/components/admin/filter-form"
import { PageHeader } from "@/components/admin/page-header"
import { TablePagination } from "@/components/admin/table-pagination"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
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

const SORT_OPTIONS = [
  { value: "", label: "Сначала новые" },
  { value: "createdAt,asc", label: "Сначала старые" },
  { value: "lastLoginAt,desc", label: "По последнему входу" },
  { value: "email,asc", label: "По email" },
  { value: "displayName,asc", label: "По имени" },
]

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
        <Field className="w-auto">
          <FieldLabel htmlFor="sort">Сортировка</FieldLabel>
          <NativeSelect id="sort" name="sort" defaultValue={params.sort ?? ""}>
            {SORT_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
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
                <TableHead>Пользователь</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Роли</TableHead>
                <TableHead>Зарегистрирован</TableHead>
                <TableHead>Последний вход</TableHead>
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
