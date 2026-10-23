"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { HandIcon, LockIcon, MailWarningIcon, XIcon } from "lucide-react"

import { CommentDialog } from "@/components/admin/comment-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import {
  closeCaseByComplaint,
  rejectComplaint,
  takeComplaint,
  warnByComplaint,
} from "@/lib/admin/actions"
import type { AdminComplaint } from "@/lib/api/admin-types"

export function ComplaintActions({ complaint }: { complaint: AdminComplaint }) {
  const router = useRouter()
  const [taking, startTake] = useTransition()
  const refresh = () => router.refresh()

  function take() {
    startTake(async () => {
      const result = await takeComplaint(complaint.id)
      if (!result.ok) {
        toast.add({ title: "Не удалось взять жалобу", description: result.error.message, type: "error" })
        return
      }
      toast.add({ title: "Жалоба взята в работу", type: "success" })
      refresh()
    })
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {complaint.status === "NEW" && (
        <Button variant="ghost" size="sm" onClick={take} disabled={taking}>
          {taking ? <Spinner data-icon="inline-start" /> : <HandIcon data-icon="inline-start" />}
          Взять
        </Button>
      )}
      <CommentDialog
        trigger={
          <>
            <XIcon data-icon="inline-start" />
            Отклонить
          </>
        }
        triggerVariant="ghost"
        disabled={taking}
        title="Отклонение жалобы"
        description="Нарушения нет: объект жалобы останется как есть."
        label="Комментарий"
        hint="До 500 символов, виден только модераторам"
        placeholder="Например: информация в объявлении соответствует правилам"
        submitLabel="Отклонить жалобу"
        successTitle="Жалоба отклонена"
        field="comment"
        onSubmit={(text) => rejectComplaint(complaint.id, text)}
        onSuccess={refresh}
      />
      <CommentDialog
        trigger={
          <>
            <MailWarningIcon data-icon="inline-start" />
            Предупредить
          </>
        }
        disabled={taking}
        title="Предупреждение нарушителю"
        description={
          complaint.targetType === "CASE"
            ? "Автор объявления получит письмо и уведомление с этим текстом. Объявление останется опубликованным."
            : "Пользователь получит письмо и уведомление с этим текстом."
        }
        label="Текст предупреждения"
        hint="До 500 символов, нарушитель увидит его в уведомлении"
        placeholder="Например: уберите из описания контакты для продажи животного"
        submitLabel="Отправить"
        successTitle="Предупреждение отправлено"
        field="comment"
        onSubmit={(text) => warnByComplaint(complaint.id, text)}
        onSuccess={refresh}
      />
      {complaint.targetType === "CASE" && (
        <CommentDialog
          trigger={
            <>
              <LockIcon data-icon="inline-start" />
              Закрыть объявление
            </>
          }
          triggerVariant="destructive"
          disabled={taking}
          title="Закрытие объявления"
          description="Объявление пропадёт из ленты, его потребности и чаты закроются. Другие необработанные жалобы на него тоже будут закрыты. Автор получит уведомление с причиной."
          label="Причина"
          hint="До 500 символов, автор увидит её в уведомлении"
          placeholder="Например: объявление о продаже животного"
          submitLabel="Закрыть объявление"
          destructive
          successTitle="Объявление закрыто"
          field="comment"
          onSubmit={(text) => closeCaseByComplaint(complaint.id, text)}
          onSuccess={refresh}
        />
      )}
    </div>
  )
}
