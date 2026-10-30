import type { Metadata } from "next"
import { Suspense } from "react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { DataTable } from "@/components/admin/data-table"
import { FaqDialog } from "@/components/admin/faq-dialog"
import { FaqRowActions } from "@/components/admin/faq-row-actions"
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
import { formatDateTime } from "@/lib/admin/format"
import type { Faq } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "FAQ" }

export default function FaqPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <FaqTable />
    </Suspense>
  )
}

async function FaqTable() {
  const result = await adminGet<Faq[]>("/admin/faq")
  const nextSortOrder = result.ok ? Math.max(0, ...result.data.map((faq) => faq.sortOrder)) + 10 : 10

  return (
    <>
      <PageHeader
        title="FAQ"
        description="Частые вопросы на сайте. Изменения видны на сайте сразу после сохранения"
      >
        <FaqDialog nextSortOrder={nextSortOrder} />
      </PageHeader>
      {!result.ok ? (
        <ApiErrorAlert error={result.error} />
      ) : result.data.length === 0 ? (
        <NoResults description="Добавьте первый вопрос" />
      ) : (
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">Порядок</TableHead>
              <TableHead>Вопрос (ru)</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Изменён</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((faq) => (
              <TableRow key={faq.id}>
                <TableCell className="text-right tabular-nums">{faq.sortOrder}</TableCell>
                <TableCell className="max-w-96 whitespace-normal">{faq.questionRu}</TableCell>
                <TableCell>
                  {faq.published ? (
                    <Badge variant="secondary">Опубликован</Badge>
                  ) : (
                    <Badge variant="outline">Черновик</Badge>
                  )}
                </TableCell>
                <TableCell>{formatDateTime(faq.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <FaqRowActions faq={faq} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
    </>
  )
}
