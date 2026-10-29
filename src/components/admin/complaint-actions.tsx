"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HandIcon, LockIcon, MailWarningIcon, XIcon } from "lucide-react"

import { CommentDialog } from "@/components/admin/comment-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import {
  closeComplaintTarget,
  rejectComplaint,
  takeComplaint,
  warnByComplaint,
} from "@/lib/admin/actions"
import type { AdminComplaint, ComplaintTargetType } from "@/lib/api/admin-types"
import type { ApiError } from "@/lib/api/types"

const WARN_DESCRIPTIONS: Partial<Record<ComplaintTargetType, string>> = {
  CASE: "Автор объявления получит письмо и уведомление с этим текстом. Объявление останется опубликованным.",
  USER: "Пользователь получит письмо и уведомление с этим текстом.",
  CONVERSATION:
    "Второй участник диалога (не автор жалобы) получит письмо и уведомление с этим текстом. Чат останется открытым.",
}

// The user can't be closed by a complaint: blocking lives in the users section.
const CLOSE_TARGET: Partial<
  Record<
    ComplaintTargetType,
    {
      label: string
      title: string
      description: string
      hint: string
      placeholder: string
      successTitle: string
      confirmation?: string
    }
  >
> = {
  CASE: {
    label: "Закрыть объявление",
    title: "Закрытие объявления",
    description:
      "Объявление пропадёт из ленты, его потребности и чаты закроются. Другие необработанные жалобы на него тоже будут закрыты. Автор получит уведомление с причиной.",
    hint: "До 500 символов, автор увидит её в уведомлении",
    placeholder: "Например: объявление о продаже животного",
    successTitle: "Объявление закрыто",
  },
  CONVERSATION: {
    label: "Закрыть чат",
    title: "Закрытие чата",
    description:
      "Чат закроется от имени модератора, писать в него больше не получится. Другие необработанные жалобы на этот чат тоже будут закрыты.",
    hint: "До 500 символов, причина закрытия чата",
    placeholder: "Например: оскорбления в переписке",
    successTitle: "Чат закрыт",
    confirmation: "Закрытие чата необратимо для участников: переоткрыть его они не смогут.",
  },
}

const TARGET_NOT_FOUND = ["CASE_NOT_FOUND", "CONVERSATION_NOT_FOUND", "USER_NOT_FOUND"]

const TOAST_ERRORS = ["ACCESS_DENIED", "CASE_CLOSED", "CASE_NOT_PUBLISHED", "COMPLAINT_TARGET_NOT_CLOSABLE"]

/**
 * Decisions on an open complaint, limited to what the backend allows for its target type.
 * Without callbacks the current route is refreshed, which suits the queue; the complaint card passes
 * `onUpdate`/`onReload` so that it does not re-render and re-request the audited complaint target.
 */
export function ComplaintActions({
  complaint,
  targetMissing = false,
  onUpdate,
  onReload,
}: {
  complaint: AdminComplaint
  targetMissing?: boolean
  onUpdate?: (complaint: AdminComplaint) => void
  onReload?: () => void
}) {
  const router = useRouter()
  const [taking, startTake] = useTransition()
  const [targetGone, setTargetGone] = useState(targetMissing)
  const update = onUpdate ?? (() => router.refresh())
  const reload = onReload ?? (() => router.refresh())
  const warnDescription = WARN_DESCRIPTIONS[complaint.targetType]
  const close = CLOSE_TARGET[complaint.targetType]

  function handleError(title: string, error: ApiError) {
    if (error.code === "COMPLAINT_ALREADY_PROCESSED") {
      toast.add({ title: "Жалобу уже рассмотрели", description: error.message, type: "error" })
      reload()
      return true
    }
    if (error.code && TARGET_NOT_FOUND.includes(error.code)) {
      toast.add({ title: "Объект жалобы удалён", description: error.message, type: "error" })
      setTargetGone(true)
      return true
    }
    if (error.code && TOAST_ERRORS.includes(error.code)) {
      toast.add({ title, description: error.message, type: "error" })
      return true
    }
    return false
  }

  function take() {
    startTake(async () => {
      const result = await takeComplaint(complaint.id)
      if (!result.ok) {
        if (!handleError("Не удалось взять жалобу", result.error)) {
          toast.add({ title: "Не удалось взять жалобу", description: result.error.message, type: "error" })
        }
        return
      }
      toast.add({ title: "Жалоба взята в работу", type: "success" })
      update(result.data)
    })
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {complaint.status === "NEW" && !targetGone && (
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
        onSuccess={update}
        onError={(error) => handleError("Не удалось отклонить жалобу", error)}
      />
      {warnDescription && !targetGone && (
        <CommentDialog
          trigger={
            <>
              <MailWarningIcon data-icon="inline-start" />
              Предупредить
            </>
          }
          disabled={taking}
          title="Предупреждение нарушителю"
          description={warnDescription}
          label="Текст предупреждения"
          hint="До 500 символов, нарушитель увидит его в уведомлении"
          placeholder="Например: уберите из описания контакты для продажи животного"
          submitLabel="Отправить"
          successTitle="Предупреждение отправлено"
          field="comment"
          onSubmit={(text) => warnByComplaint(complaint.id, text)}
          onSuccess={update}
          onError={(error) => handleError("Не удалось отправить предупреждение", error)}
        />
      )}
      {close && !targetGone && (
        <CommentDialog
          trigger={
            <>
              <LockIcon data-icon="inline-start" />
              {close.label}
            </>
          }
          triggerVariant="destructive"
          disabled={taking}
          title={close.title}
          description={close.description}
          label="Причина"
          hint={close.hint}
          placeholder={close.placeholder}
          submitLabel={close.label}
          destructive
          successTitle={close.successTitle}
          field="comment"
          confirmation={close.confirmation}
          onSubmit={(text) => closeComplaintTarget(complaint.id, text)}
          onSuccess={update}
          onError={(error) => handleError("Не удалось закрыть объект жалобы", error)}
        />
      )}
    </div>
  )
}
