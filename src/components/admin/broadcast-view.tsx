"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCwIcon, Trash2Icon } from "lucide-react"

import { PageHeader } from "@/components/admin/page-header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { deleteBroadcast, getBroadcast } from "@/lib/admin/actions"
import { formatDateTime } from "@/lib/admin/format"
import { BROADCAST_AUDIENCE_LABELS, BROADCAST_CHANNEL_LABELS } from "@/lib/admin/labels"
import type { Broadcast } from "@/lib/api/admin-types"

const POLL_INTERVAL_MS = 4000
const POLL_LIMIT_MS = 10 * 60 * 1000

/**
 * Broadcast page. While recipients are still pending the statistics are re-requested every few seconds; polling
 * stops when nothing is pending, on leaving the page, or after ten minutes, when a manual refresh is offered.
 */
export function BroadcastView({ initial }: { initial: Broadcast }) {
  const router = useRouter()
  const [broadcast, setBroadcast] = useState(initial)
  const [timedOut, setTimedOut] = useState(false)
  const [refreshing, startRefresh] = useTransition()
  const [deleting, startDelete] = useTransition()
  const processed = broadcast.sent + broadcast.failed + broadcast.skipped
  const progress = broadcast.totalRecipients > 0 ? Math.min(100, (processed / broadcast.totalRecipients) * 100) : 100
  const done = broadcast.pending === 0

  useEffect(() => {
    if (done || timedOut) return
    const startedAt = Date.now()
    const timer = setInterval(async () => {
      if (Date.now() - startedAt > POLL_LIMIT_MS) {
        setTimedOut(true)
        return
      }
      const result = await getBroadcast(initial.id)
      if (result.ok) setBroadcast(result.data)
    }, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [initial.id, done, timedOut])

  function refresh() {
    startRefresh(async () => {
      const result = await getBroadcast(initial.id)
      if (!result.ok) {
        toast.add({ title: "Не удалось обновить статистику", description: result.error.message, type: "error" })
        return
      }
      setBroadcast(result.data)
      setTimedOut(false)
    })
  }

  function remove() {
    startDelete(async () => {
      const result = await deleteBroadcast(initial.id)
      if (!result.ok && result.error.code !== "BROADCAST_NOT_FOUND") {
        toast.add({ title: "Не удалось удалить рассылку", description: result.error.message, type: "error" })
        return
      }
      toast.add({ title: "Рассылка удалена из истории", type: "success" })
      router.push("/admin/broadcasts")
    })
  }

  const stats: [string, number][] = [
    ["Доставлено", broadcast.sent],
    ["Ошибки", broadcast.failed],
    ["Пропущено", broadcast.skipped],
    ["В очереди", broadcast.pending],
  ]

  return (
    <>
      <PageHeader
        title={broadcast.title}
        description={`${BROADCAST_CHANNEL_LABELS[broadcast.channel] ?? broadcast.channel} · ${BROADCAST_AUDIENCE_LABELS[broadcast.audience] ?? broadcast.audience} · ${formatDateTime(broadcast.createdAt)}`}
      >
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" disabled={deleting} />}>
            {deleting ? <Spinner data-icon="inline-start" /> : <Trash2Icon data-icon="inline-start" />}
            Удалить из истории
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить рассылку из истории?</AlertDialogTitle>
              <AlertDialogDescription>
                Рассылка пропадёт из истории. Уже отправленные уведомления у пользователей останутся.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={remove}>
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageHeader>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Текст</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="whitespace-pre-line break-words">{broadcast.message}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Автор</dt>
              <dd>{broadcast.createdByName ?? broadcast.createdBy}</dd>
              <dt className="text-muted-foreground">Получателей</dt>
              <dd className="tabular-nums">{broadcast.totalRecipients}</dd>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Статистика</CardTitle>
            {(timedOut || !done) && (
              <Button variant="ghost" size="sm" onClick={refresh} disabled={refreshing}>
                {refreshing ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
                Обновить
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 rounded-full bg-muted"
            >
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {stats.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-xl font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            {timedOut && !done && (
              <p className="text-xs text-muted-foreground">Автообновление остановлено. Нажмите «Обновить».</p>
            )}
            {broadcast.skipped > 0 && (
              <p className="text-xs text-muted-foreground">
                Не отправлено: нет подходящего адреса (для SMS нужен подтверждённый телефон), пользователь неактивен
                или пачка не поставлена в очередь.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
