import type { Metadata } from "next"
import { Suspense } from "react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { DataTable } from "@/components/admin/data-table"
import { FilterForm } from "@/components/admin/filter-form"
import { CaseStatusBadge } from "@/components/admin/status-badges"
import { TablePagination } from "@/components/admin/table-pagination"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
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
import { ANIMAL_TYPE_LABELS, CASE_STATUS_LABELS } from "@/lib/admin/labels"
import type { Page, UserCase } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Объявления пользователя" }

const PARAMS = ["search", "status", "sort", "size", "page"] as const

const SORT_OPTIONS = [
  { value: "", label: "Сначала новые" },
  { value: "createdAt,asc", label: "Сначала старые" },
  { value: "title,asc", label: "По заголовку" },
  { value: "status,asc", label: "По статусу" },
]

export default function UserCasesPage({ params, searchParams }: PageProps<"/admin/users/[userId]/cases">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <UserCases params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function UserCases({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<SearchParams>
}) {
  const { userId } = await params
  const query = pickParams(await searchParams, PARAMS)
  const result = await adminGet<Page<UserCase>>(`/admin/users/${userId}/cases`, query)

  return (
    <>
      <FilterForm key={JSON.stringify(query)} resetHref={`/admin/users/${userId}/cases`}>
        <Field className="w-64">
          <FieldLabel htmlFor="search">Заголовок</FieldLabel>
          <Input id="search" name="search" defaultValue={query.search} placeholder="Подстрока заголовка" />
        </Field>
        <Field className="w-auto">
          <FieldLabel htmlFor="status">Статус</FieldLabel>
          <NativeSelect id="status" name="status" defaultValue={query.status ?? ""}>
            <NativeSelectOption value="">Все</NativeSelectOption>
            {Object.entries(CASE_STATUS_LABELS).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field className="w-auto">
          <FieldLabel htmlFor="sort">Сортировка</FieldLabel>
          <NativeSelect id="sort" name="sort" defaultValue={query.sort ?? ""}>
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
        <NoResults description="У пользователя нет объявлений с такими условиями" />
      ) : (
        <>
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Заголовок</TableHead>
                <TableHead>Животное</TableHead>
                <TableHead>Город</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Открытых потребностей</TableHead>
                <TableHead className="text-right">Откликов</TableHead>
                <TableHead>Создано</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.content.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-72 truncate font-medium">{item.title}</TableCell>
                  <TableCell>{ANIMAL_TYPE_LABELS[item.animalType] ?? item.animalType}</TableCell>
                  <TableCell>{item.cityCode ?? "—"}</TableCell>
                  <TableCell>
                    <CaseStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{item.openNeedsCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.applicationsCount}</TableCell>
                  <TableCell>{formatDateTime(item.createdAt)}</TableCell>
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
