import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { BadgeArtwork } from "@/components/admin/badges/badge-artwork"
import { BadgeRowActions } from "@/components/admin/badges/badge-row-actions"
import { DataTable } from "@/components/admin/data-table"
import { PageHeader } from "@/components/admin/page-header"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
import { buttonVariants } from "@/components/ui/button"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getBadges } from "@/lib/admin/badges/api"
import { BADGES_PATH, CATEGORY_LABELS } from "@/lib/admin/badges/model"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Значки" }

export default function BadgesPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <BadgesTable />
    </Suspense>
  )
}

async function BadgesTable() {
  const result = await getBadges()
  return (
    <>
      <PageHeader title="Значки" description="Управляйте достижениями, оформлением и условиями выдачи.">
        {result.ok && (
          <Link className={buttonVariants()} href={`${BADGES_PATH}/new`}>
            <PlusIcon data-icon="inline-start" />
            Добавить значок
          </Link>
        )}
      </PageHeader>
      {!result.ok ? (
        <ApiErrorAlert error={result.error} />
      ) : result.data.length === 0 ? (
        <NoResults description="В каталоге пока нет значков" />
      ) : (
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>Значок</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Условие выдачи</TableHead>
              <TableHead className="text-right">Получили</TableHead>
              <TableHead className="text-right">Порядок</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((badge) => (
              <TableRow key={badge.code}>
                <TableCell className={cn(!badge.active && "text-muted-foreground")}>
                  <div className="flex items-center gap-3">
                    <span className={cn(!badge.active && "opacity-55")}>
                      <BadgeArtwork badge={badge} />
                    </span>
                    <div className="flex min-w-40 flex-col whitespace-normal [overflow-wrap:anywhere]">
                      <span className="font-semibold">{badge.nameRu}</span>
                      <span lang="be" className="text-sm text-muted-foreground">
                        {badge.nameBe}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{CATEGORY_LABELS[badge.category] ?? badge.category}</TableCell>
                <TableCell className="font-mono text-xs">
                  {badge.metric} ≥ {badge.threshold.toLocaleString("ru")}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {badge.awardedCount.toLocaleString("ru")}
                </TableCell>
                <TableCell className="text-right tabular-nums">{badge.sortOrder}</TableCell>
                <TableCell>
                  <BadgeRowActions badge={badge} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
    </>
  )
}
