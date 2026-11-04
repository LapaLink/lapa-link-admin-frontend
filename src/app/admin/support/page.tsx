import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { DataTable } from "@/components/admin/data-table"
import { PageHeader } from "@/components/admin/page-header"
import { TablePagination } from "@/components/admin/table-pagination"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
import { Badge } from "@/components/ui/badge"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { adminGet } from "@/lib/admin/api"
import { formatDateTime, pickParams, type SearchParams } from "@/lib/admin/format"
import { SUPPORT_QUESTION_STATUS_LABELS } from "@/lib/admin/labels"
import type { Page, SupportQuestion } from "@/lib/api/admin-types"
import { getCurrentUser } from "@/lib/auth/current-user"

export const metadata: Metadata = { title: "Вопросы пользователей" }

const PARAMS = ["status", "size", "page"] as const

// "ALL" is a UI-only value: the backend returns every status when `status` is omitted.
const TABS = [
  { value: "NEW", label: "Новые" },
  { value: "IN_PROGRESS", label: "В работе" },
  { value: "CLOSED", label: "Закрытые" },
  { value: "ALL", label: "Все" },
]

export default function SupportQuestionsPage({ searchParams }: PageProps<"/admin/support">) {
  return (
    <>
      <PageHeader
        title="Вопросы пользователей"
        description="Вопросы администратору, сначала самые старые. Ответить можно после «Взять в работу»"
      />
      <Suspense fallback={<TableSkeleton />}>
        <SupportQuestions searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function SupportQuestions({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = pickParams(await searchParams, PARAMS)
  const tab = query.status ?? "NEW"
  const [result, user] = await Promise.all([
    adminGet<Page<SupportQuestion>>("/admin/support-questions", {
      ...query,
      status: tab === "ALL" ? undefined : tab,
    }),
    getCurrentUser(),
  ])

  return (
    <>
      <Tabs value={tab}>
        <TabsList>
          {TABS.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              nativeButton={false}
              render={<Link href={`/admin/support?status=${item.value}`} />}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {!result.ok ? (
        <ApiErrorAlert error={result.error} />
      ) : result.data.content.length === 0 ? (
        <NoResults description="Вопросов нет" />
      ) : (
        <>
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Автор</TableHead>
                <TableHead>Вопрос</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Взял</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.content.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="tabular-nums">{formatDateTime(item.createdAt)}</TableCell>
                  <TableCell>
                    <div>{item.userDisplayName ?? "Без имени"}</div>
                    <div className="text-xs text-muted-foreground">{item.userEmail}</div>
                  </TableCell>
                  <TableCell className="max-w-96 whitespace-normal">
                    <Link href={`/admin/support/${item.id}`} className="underline-offset-4 hover:underline">
                      {item.message.length > 100 ? `${item.message.slice(0, 100)}…` : item.message}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === "NEW" ? "default" : "outline"}>
                      {SUPPORT_QUESTION_STATUS_LABELS[item.status] ?? item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.assignedTo == null ? "—" : item.assignedTo === user.id ? "вы" : item.assignedTo}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
          <TablePagination page={result.data} params={{ ...query, status: tab }} />
        </>
      )}
    </>
  )
}
