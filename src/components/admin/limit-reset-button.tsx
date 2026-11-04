"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RotateCcwIcon } from "lucide-react"

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
import { toast } from "@/components/ui/toast"
import { resetUserLimit } from "@/lib/admin/actions"
import { LIMIT_TYPE_LABELS } from "@/lib/admin/labels"
import type { LimitBanType, LimitType } from "@/lib/api/admin-types"

const REFRESH_ERRORS = ["USER_NOT_FOUND", "OPERATION_LIMIT_NOT_FOUND"]

/** Resets one user's limit: zeroes the counter and lifts the ban; an account ban also returns the user to ACTIVE. */
export function LimitResetButton({
  userId,
  limitType,
  limitBanType,
  blocked,
}: {
  userId: string
  limitType: LimitType
  limitBanType: LimitBanType
  blocked: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const accountBan = blocked && limitBanType !== "ACTION"

  function reset() {
    startTransition(async () => {
      const result = await resetUserLimit(userId, limitType)
      if (!result.ok) {
        const retry = result.error.code === "OPERATION_IN_PROGRESS" ? "Повторите запрос через секунду. " : ""
        toast.add({ title: "Не удалось сбросить лимит", description: retry + result.error.message, type: "error" })
        if (result.error.code && REFRESH_ERRORS.includes(result.error.code)) router.refresh()
        return
      }
      toast.add({ title: "Лимит сброшен", type: "success" })
      router.refresh()
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" disabled={pending} />}>
        {pending ? <Spinner data-icon="inline-start" /> : <RotateCcwIcon data-icon="inline-start" />}
        Сбросить
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Сбросить лимит «{LIMIT_TYPE_LABELS[limitType] ?? limitType}»?</AlertDialogTitle>
          <AlertDialogDescription>
            Счётчик обнулится, бан по этому лимиту снимется.
            {accountBan && " Статус пользователя вернётся в «Активен»."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={reset}>Сбросить</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
