import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowRightIcon } from "lucide-react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { DataTable } from "@/components/admin/data-table"
import { FilterForm } from "@/components/admin/filter-form"
import { PageHeader } from "@/components/admin/page-header"
import { CaseStatusBadge } from "@/components/admin/status-badges"
import { TablePagination } from "@/components/admin/table-pagination"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
import { Button } from "@/components/ui/button"
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
import type { AdminCase, Page } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Объявления" }

const PARAMS = ["search", "status", "authorId", "size", "page"] as const

export default function CasesPage({ searchParams }: PageProps<"/admin/cases">) {
  return (
    <>
      <PageHeader
        title="Объявления"
        description="Все объявления в любом статусе, сначала новые. Закрыть или удалить объявление можно на его странице."
      />
      <Suspense fallback={<TableSkeleton />}>
        <Cases searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function Cases({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = pickParams(await searchParams, PARAMS)
  const result = await adminGet<Page<AdminCase>>("/admin/cases", query)

  return (
    <>
      <FilterForm key={JSON.stringify(query)} resetHref="/admin/cases">
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
        {query.authorId && <input type="hidden" name="authorId" value={query.authorId} />}
      </FilterForm>
      {!result.ok ? (
        <ApiErrorAlert error={result.error} />
      ) : result.data.content.length === 0 ? (
        <NoResults description="Объявлений с такими условиями нет" />
      ) : (
        <>
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Заголовок</TableHead>
                <TableHead>Животное</TableHead>
                <TableHead>Город</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Автор</TableHead>
                <TableHead>Создано</TableHead>
                <TableHead />
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
                  <TableCell>
                    <Link href={`/admin/users/${item.authorId}/cases`} className="underline-offset-4 hover:underline">
                      Профиль
                    </Link>
                  </TableCell>
                  <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/admin/moderation/${item.id}`} />}
                    >
                      Открыть
                      <ArrowRightIcon data-icon="inline-end" />
                    </Button>
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
