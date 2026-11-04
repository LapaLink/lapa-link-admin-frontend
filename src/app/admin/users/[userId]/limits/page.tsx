import type { Metadata } from "next"
import { Suspense } from "react"
import { CircleAlertIcon } from "lucide-react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { DataTable } from "@/components/admin/data-table"
import { LimitResetButton } from "@/components/admin/limit-reset-button"
import { NoResults, TableSkeleton } from "@/components/admin/table-states"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { adminGet } from "@/lib/admin/api"
import { formatDateTime } from "@/lib/admin/format"
import { LIMIT_BAN_TYPE_LABELS, LIMIT_TYPE_LABELS } from "@/lib/admin/labels"
import { formatInterval } from "@/lib/admin/limits"
import type { UserOperationLimit } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Лимиты пользователя" }

export default function UserLimitsPage({ params }: PageProps<"/admin/users/[userId]/limits">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <UserLimits params={params} />
    </Suspense>
  )
}

async function UserLimits({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const result = await adminGet<UserOperationLimit[]>(`/admin/limits/users/${encodeURIComponent(userId)}`)
  if (!result.ok) return <ApiErrorAlert error={result.error} />
  if (result.data.length === 0) return <NoResults description="Правил лимитов нет" />

  const suspension = result.data.find((item) => item.blocked && item.limitBanType === "ACCOUNT")
  const permanent = result.data.find((item) => item.permanentlyBlocked)

  return (
    <>
      {suspension && (
        <Alert>
          <CircleAlertIcon />
          <AlertTitle>Аккаунт приостановлен по лимиту «{LIMIT_TYPE_LABELS[suspension.limitType] ?? suspension.limitType}»</AlertTitle>
          <AlertDescription>
            Блокировка снимется автоматически
            {suspension.blockedUntil ? ` после ${formatDateTime(suspension.blockedUntil)}` : ""}, с задержкой до минуты.
            Досрочно снять её можно кнопкой «Сбросить» в строке этого лимита.
          </AlertDescription>
        </Alert>
      )}
      {permanent && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>Бессрочный бан по лимиту «{LIMIT_TYPE_LABELS[permanent.limitType] ?? permanent.limitType}»</AlertTitle>
          <AlertDescription>Снять его можно кнопкой «Сбросить» в строке этого лимита или «Разблокировать» в списке пользователей.</AlertDescription>
        </Alert>
      )}
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Операция</TableHead>
            <TableHead>Использовано</TableHead>
            <TableHead>Окно</TableHead>
            <TableHead>Состояние</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.data.map((item) => (
            <TableRow key={item.limitType} className={item.enabled ? undefined : "opacity-60"}>
              <TableCell>
                {LIMIT_TYPE_LABELS[item.limitType] ?? item.limitType}
                {!item.enabled && <Badge variant="outline" className="ml-2">Выключено</Badge>}
                <div className="text-xs text-muted-foreground">
                  {LIMIT_BAN_TYPE_LABELS[item.limitBanType] ?? item.limitBanType}
                </div>
              </TableCell>
              <TableCell>
                <div className="tabular-nums">
                  {item.count} / {item.maxCount}
                  <span className="text-xs text-muted-foreground"> · осталось {item.remaining}</span>
                </div>
                <div className="mt-1 h-1.5 w-28 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (item.count / item.maxCount) * 100)}%` }}
                  />
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {item.windowEndsAt ? (
                  <>
                    <div>до {formatDateTime(item.windowEndsAt)}</div>
                    <div className="text-xs text-muted-foreground">
                      окно {formatInterval(item.windowSize, item.timeUnit)}
                    </div>
                  </>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {item.permanentlyBlocked ? (
                  <Badge variant="destructive">Заблокировано бессрочно</Badge>
                ) : item.blocked ? (
                  <Badge variant="destructive">
                    {item.blockedUntil ? `Заблокировано до ${formatDateTime(item.blockedUntil)}` : "Заблокировано"}
                  </Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-right">
                {(item.blocked || item.count > 0) && (
                  <LimitResetButton
                    userId={userId}
                    limitType={item.limitType}
                    limitBanType={item.limitBanType}
                    blocked={item.blocked}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </>
  )
}
