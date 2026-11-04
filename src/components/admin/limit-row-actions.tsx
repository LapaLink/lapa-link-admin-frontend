"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2Icon } from "lucide-react"

import { LimitDialog } from "@/components/admin/limit-dialog"
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
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { deleteLimit, updateLimit } from "@/lib/admin/actions"
import { LIMIT_TYPE_LABELS } from "@/lib/admin/labels"
import type { LimitType, OperationLimit } from "@/lib/api/admin-types"
import type { ApiError } from "@/lib/api/types"

/** Enable switch, editing and deletion of one limit rule. */
export function LimitRowActions({ limit, existing }: { limit: OperationLimit; existing: LimitType[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function fail(title: string, error: ApiError) {
    toast.add({ title, description: error.message, type: "error" })
    if (error.code === "OPERATION_LIMIT_NOT_FOUND") router.refresh()
  }

  function toggle(enabled: boolean) {
    startTransition(async () => {
      const { description, maxCount, windowSize, timeUnit, auditAction, limitBanType, banDuration } = limit
      const result = await updateLimit(limit.limitType, {
        enabled,
        description,
        maxCount,
        windowSize,
        timeUnit,
        auditAction,
        limitBanType,
        banDuration,
      })
      if (!result.ok) {
        fail("Не удалось изменить правило", result.error)
        return
      }
      toast.add({ title: enabled ? "Правило включено" : "Правило выключено", type: "success" })
      router.refresh()
    })
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteLimit(limit.limitType)
      if (!result.ok) {
        fail("Не удалось удалить правило", result.error)
        return
      }
      toast.add({ title: "Правило удалено", type: "success" })
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Switch checked={limit.enabled} onCheckedChange={toggle} disabled={pending} aria-label="Включено" />
      <LimitDialog limit={limit} existing={existing} />
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="ghost" size="sm" disabled={pending} />}>
          {pending ? <Spinner data-icon="inline-start" /> : <Trash2Icon data-icon="inline-start" />}
          Удалить
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить правило «{LIMIT_TYPE_LABELS[limit.limitType] ?? limit.limitType}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Вместе с правилом удалятся счётчики и баны всех пользователей по этому лимиту. Чтобы лишь временно
              отключить его, выключите правило переключателем.
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
    </div>
  )
}
