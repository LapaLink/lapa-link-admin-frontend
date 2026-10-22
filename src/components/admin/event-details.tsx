"use client"

import { JsonView } from "@/components/admin/json-view"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { formatDateTime } from "@/lib/admin/format"
import { AUDIT_ACTION_LABELS } from "@/lib/admin/labels"
import type { AuditLogEntry } from "@/lib/api/admin-types"

export function EventDetails({ event }: { event: AuditLogEntry }) {
  const rows: [string, string | null][] = [
    ["Идентификатор", event.id],
    ["Инициатор", [event.actorType, event.actorRole, event.actorId].filter(Boolean).join(" · ")],
    ["Объект", [event.targetType, event.targetId].filter(Boolean).join(" · ") || null],
    ["Код ошибки", event.errorCode],
    ["Причина", event.reason],
    ["Запрос", event.requestId],
    ["IP", event.ip],
  ]

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="sm" />}>Подробнее</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{AUDIT_ACTION_LABELS[event.action] ?? event.action}</SheetTitle>
          <SheetDescription>{formatDateTime(event.occurredAt)}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-mono text-xs break-all">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          {event.changes && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Изменения</h3>
              <JsonView value={event.changes} />
            </div>
          )}
          {event.metadata && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Метаданные</h3>
              <JsonView value={event.metadata} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
