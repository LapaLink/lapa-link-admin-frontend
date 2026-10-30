import type { Metadata } from "next"
import { Suspense } from "react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { DataTable } from "@/components/admin/data-table"
import { JobButton } from "@/components/admin/job-button"
import { PageHeader } from "@/components/admin/page-header"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
import { TemplateViewer } from "@/components/admin/template-viewer"
import { Badge } from "@/components/ui/badge"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { adminGet } from "@/lib/admin/api"
import { NOTIFICATION_EVENT_LABELS } from "@/lib/admin/labels"
import type { NotificationTemplate } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Шаблоны уведомлений" }

const CHANNEL_LABELS: Record<NotificationTemplate["channel"], string> = {
  EMAIL: "Email",
  IN_APP: "В приложении",
}

export default function NotificationTemplatesPage() {
  return (
    <>
      <PageHeader
        title="Шаблоны уведомлений"
        description="Шаблоны, загруженные в приложение сейчас"
      >
        <JobButton job="NOTIFICATION_TEMPLATES_REFRESH" label="Перезагрузить шаблоны" />
      </PageHeader>
      <Suspense fallback={<TableSkeleton />}>
        <TemplatesTable />
      </Suspense>
    </>
  )
}

async function TemplatesTable() {
  const result = await adminGet<NotificationTemplate[]>("/admin/notification-templates")
  if (!result.ok) return <ApiErrorAlert error={result.error} />
  if (result.data.length === 0) return <NoResults description="Шаблоны не загружены" />

  const templates = result.data.toSorted(
    (a, b) => a.eventType.localeCompare(b.eventType) || a.channel.localeCompare(b.channel)
  )

  return (
    <DataTable>
      <TableHeader>
        <TableRow>
          <TableHead>Событие</TableHead>
          <TableHead>Канал</TableHead>
          <TableHead>Языки</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((template) => (
          <TableRow key={`${template.eventType}:${template.channel}`}>
            <TableCell>
              {NOTIFICATION_EVENT_LABELS[template.eventType] ?? template.eventType}
              <div className="font-mono text-xs text-muted-foreground">{template.eventType}</div>
            </TableCell>
            <TableCell>{CHANNEL_LABELS[template.channel] ?? template.channel}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                {template.locales.toSorted().map((locale) => (
                  <Badge key={locale} variant="outline">
                    {locale.toLowerCase()}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <TemplateViewer template={template} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  )
}
