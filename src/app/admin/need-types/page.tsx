import type { Metadata } from "next"
import { Suspense } from "react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { DataTable } from "@/components/admin/data-table"
import { NeedTypeDialog } from "@/components/admin/need-type-dialog"
import { PageHeader } from "@/components/admin/page-header"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
import { Badge } from "@/components/ui/badge"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { adminGet } from "@/lib/admin/api"
import type { NeedType } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Типы помощи" }

export default function NeedTypesPage() {
  return (
    <>
      <PageHeader
        title="Типы помощи"
        description="Удаления нет: отключённый тип нельзя выбрать для новых потребностей, существующие сохраняются"
      >
        <NeedTypeDialog />
      </PageHeader>
      <Suspense fallback={<TableSkeleton />}>
        <NeedTypesTable />
      </Suspense>
    </>
  )
}

async function NeedTypesTable() {
  const result = await adminGet<NeedType[]>("/admin/need-types")
  if (!result.ok) return <ApiErrorAlert error={result.error} />
  if (result.data.length === 0) return <NoResults description="Добавьте первый тип помощи" />

  return (
    <DataTable>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Порядок</TableHead>
          <TableHead>Код</TableHead>
          <TableHead>Название (ru)</TableHead>
          <TableHead>Название (be)</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {result.data.map((needType) => (
          <TableRow key={needType.code}>
            <TableCell className="text-right tabular-nums">{needType.sortOrder}</TableCell>
            <TableCell className="font-mono text-xs">{needType.code}</TableCell>
            <TableCell>{needType.nameRu}</TableCell>
            <TableCell>{needType.nameBe}</TableCell>
            <TableCell>
              {needType.active ? (
                <Badge variant="secondary">Активен</Badge>
              ) : (
                <Badge variant="outline">Отключён</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <NeedTypeDialog needType={needType} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  )
}
