import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowRightIcon } from "lucide-react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { DataTable } from "@/components/admin/data-table"
import { PageHeader } from "@/components/admin/page-header"
import { TablePagination } from "@/components/admin/table-pagination"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
import { Button } from "@/components/ui/button"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { adminGet } from "@/lib/admin/api"
import { formatDateTime, pickParams, type SearchParams } from "@/lib/admin/format"
import { ANIMAL_TYPE_LABELS } from "@/lib/admin/labels"
import type { ModerationCase, Page } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Модерация" }

const PARAMS = ["size", "page"] as const

export default function ModerationPage({ searchParams }: PageProps<"/admin/moderation">) {
  return (
    <>
      <PageHeader
        title="Модерация"
        description="Новые объявления не видны в ленте, пока их не одобрит модератор. Сначала показаны самые старые."
      />
      <Suspense fallback={<TableSkeleton />}>
        <ModerationQueue searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function ModerationQueue({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = pickParams(await searchParams, PARAMS)
  const result = await adminGet<Page<ModerationCase>>("/admin/cases/moderation", query)

  if (!result.ok) return <ApiErrorAlert error={result.error} />
  if (result.data.content.length === 0) return <NoResults description="Все объявления проверены" />

  return (
    <>
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Заголовок</TableHead>
            <TableHead>Животное</TableHead>
            <TableHead>Город</TableHead>
            <TableHead>Создано</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.data.content.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="max-w-96 truncate font-medium">{item.title}</TableCell>
              <TableCell>{ANIMAL_TYPE_LABELS[item.animalType] ?? item.animalType}</TableCell>
              <TableCell>{item.cityCode ?? "—"}</TableCell>
              <TableCell>{formatDateTime(item.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/admin/moderation/${item.id}`} />}
                >
                  Проверить
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
      <TablePagination page={result.data} params={query} />
    </>
  )
}
