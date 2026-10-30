"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { CommentDialog } from "@/components/admin/comment-dialog"
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
import { hideCase, restoreCase } from "@/lib/admin/actions"
import type { CaseStatus } from "@/lib/api/admin-types"
import type { ApiError } from "@/lib/api/types"

// Conflicts and a missing case mean the shown state is stale: report and reload the route.
const STALE_ERRORS = ["CASE_HIDDEN", "CASE_NOT_FOUND", "CASE_NOT_HIDDEN"]

const TOAST_ERRORS = ["ACCESS_DENIED", "CASE_CLOSED", "CASE_NOT_PUBLISHED"]

/** "Скрыть" for an open case and "Восстановить" for a hidden one; other statuses render nothing. */
export function CaseVisibilityActions({ caseId, status }: { caseId: string; status: CaseStatus }) {
  const router = useRouter()
  const [restoring, startRestore] = useTransition()

  function handleError(title: string, error: ApiError) {
    if (error.code && STALE_ERRORS.includes(error.code)) {
      toast.add({ title, description: error.message, type: "error" })
      router.refresh()
      return true
    }
    if (error.code && TOAST_ERRORS.includes(error.code)) {
      toast.add({ title, description: error.message, type: "error" })
      return true
    }
    return false
  }

  function restore() {
    startRestore(async () => {
      const result = await restoreCase(caseId)
      if (!result.ok) {
        if (!handleError("Не удалось восстановить объявление", result.error)) {
          toast.add({ title: "Не удалось восстановить объявление", description: result.error.message, type: "error" })
        }
        return
      }
      toast.add({ title: "Объявление восстановлено", type: "success" })
      router.refresh()
    })
  }

  if (status === "OPEN") {
    return (
      <CommentDialog
        trigger={
          <>
            <EyeOffIcon data-icon="inline-start" />
            Скрыть
          </>
        }
        title="Скрытие объявления"
        description="Объявление пропадёт из ленты, карты и подбора помощников, новые отклики станут недоступны. Потребности и назначения не изменятся. Необработанные жалобы на него будут закрыты."
        label="Причина"
        hint="До 500 символов. Автор увидит причину. Скрытие можно отменить"
        placeholder="Например: в описании указан номер телефона"
        submitLabel="Скрыть объявление"
        destructive
        successTitle="Объявление скрыто"
        field="reason"
        onSubmit={(text) => hideCase(caseId, text)}
        onSuccess={() => router.refresh()}
        onError={(error) => handleError("Не удалось скрыть объявление", error)}
      />
    )
  }

  if (status === "HIDDEN") {
    return (
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="outline" size="sm" disabled={restoring} />}>
          {restoring ? <Spinner data-icon="inline-start" /> : <EyeIcon data-icon="inline-start" />}
          Восстановить
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Восстановить объявление?</AlertDialogTitle>
            <AlertDialogDescription>
              Объявление снова станет видно всем. Автор получит уведомление.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={restore}>Восстановить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return null
}
