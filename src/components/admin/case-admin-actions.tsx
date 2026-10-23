"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { LockIcon, Trash2Icon } from "lucide-react"

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
import { closeCase, deleteCase } from "@/lib/admin/actions"
import type { CaseStatus } from "@/lib/api/admin-types"

export function CaseAdminActions({
  caseId,
  title,
  status,
}: {
  caseId: string
  title: string
  status: CaseStatus
}) {
  const router = useRouter()
  const [deleting, startDelete] = useTransition()
  const closable = status === "OPEN" || status === "PENDING_REVIEW"

  function remove() {
    startDelete(async () => {
      const result = await deleteCase(caseId)
      if (!result.ok) {
        toast.add({ title: "Не удалось удалить объявление", description: result.error.message, type: "error" })
        return
      }
      toast.add({ title: "Объявление удалено", type: "success" })
      router.push("/admin/cases")
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {closable && (
        <CommentDialog
          trigger={
            <>
              <LockIcon data-icon="inline-start" />
              Закрыть
            </>
          }
          disabled={deleting}
          title="Закрытие объявления"
          description="Объявление пропадёт из ленты, его потребности и чаты закроются, необработанные жалобы на него будут закрыты. Автор получит уведомление с причиной."
          label="Причина"
          hint="До 500 символов, автор увидит её в уведомлении"
          placeholder="Например: объявление нарушает правила площадки"
          submitLabel="Закрыть объявление"
          destructive
          successTitle="Объявление закрыто"
          field="reason"
          onSubmit={(text) => closeCase(caseId, text)}
          onSuccess={() => router.refresh()}
        />
      )}
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive" size="sm" disabled={deleting} />}>
          {deleting ? <Spinner data-icon="inline-start" /> : <Trash2Icon data-icon="inline-start" />}
          Удалить
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить объявление?</AlertDialogTitle>
            <AlertDialogDescription>
              «{title}» будет удалено безвозвратно вместе с потребностями, откликами, фото и чатами. Автор не
              получит уведомления. Чтобы только убрать объявление из ленты, закройте его.
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
