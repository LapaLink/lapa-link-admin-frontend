import type { Metadata } from "next"
import { Suspense } from "react"
import { TriangleAlertIcon } from "lucide-react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { CacheEntrySheet } from "@/components/admin/cache-entry-sheet"
import { DataTable } from "@/components/admin/data-table"
import { FilterForm } from "@/components/admin/filter-form"
import { PageHeader } from "@/components/admin/page-header"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { adminGet } from "@/lib/admin/api"
import { pickParams, type SearchParams } from "@/lib/admin/format"
import { CACHE_TYPES, type CacheKeys } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Кэш" }

export default function CachePage({ searchParams }: PageProps<"/admin/cache">) {
  return (
    <>
      <PageHeader
        title="Кэш"
        description="Записи Redis по типам. Значения OTP и активных токенов скрываются"
      />
      <Suspense fallback={<TableSkeleton />}>
        <CacheKeysTable searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function CacheKeysTable({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { type } = pickParams(await searchParams, ["type"])
  const result = await adminGet<CacheKeys>("/admin/cache", { type })

  return (
    <>
      <FilterForm key={type ?? ""} resetHref="/admin/cache">
        <Field className="w-auto">
          <FieldLabel htmlFor="type">Тип кэша</FieldLabel>
          <NativeSelect id="type" name="type" defaultValue={type ?? ""}>
            <NativeSelectOption value="">Все типы</NativeSelectOption>
            {CACHE_TYPES.map((cacheType) => (
              <NativeSelectOption key={cacheType} value={cacheType}>
                {cacheType}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </FilterForm>
      {!result.ok ? (
        <ApiErrorAlert error={result.error} />
      ) : result.data.keys.length === 0 ? (
        <NoResults description="В кэше нет записей этого типа" />
      ) : (
        <>
          {result.data.truncated && (
            <Alert>
              <TriangleAlertIcon />
              <AlertDescription>
                Показаны первые {result.data.keys.length} ключей. Выберите тип кэша, чтобы сузить выборку.
              </AlertDescription>
            </Alert>
          )}
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Тип</TableHead>
                <TableHead>Ключ</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.keys.map((entry) => (
                <TableRow key={`${entry.type}:${entry.key}`}>
                  <TableCell>
                    <Badge variant="outline">{entry.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate font-mono text-xs">{entry.key}</TableCell>
                  <TableCell className="text-right">
                    <CacheEntrySheet type={entry.type} cacheKey={entry.key} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
          <p className="text-sm text-muted-foreground">Ключей: {result.data.keys.length}</p>
        </>
      )}
    </>
  )
}
