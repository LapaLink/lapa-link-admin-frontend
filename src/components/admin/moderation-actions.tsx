"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, CircleAlertIcon, XIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { approveCase, rejectCase } from "@/lib/admin/actions"
import type { ApiError } from "@/lib/api/types"

export function ModerationActions({ caseId }: { caseId: string }) {
  const router = useRouter()
  const [approving, startApprove] = useTransition()

  function approve() {
    startApprove(async () => {
      const result = await approveCase(caseId)
      if (!result.ok) {
        toast.add({ title: "Не удалось одобрить объявление", description: result.error.message, type: "error" })
        return
      }
      toast.add({ title: "Объявление опубликовано", type: "success" })
      router.push("/admin/moderation")
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <RejectDialog caseId={caseId} disabled={approving} />
      <Button onClick={approve} disabled={approving}>
        {approving ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
        Одобрить
      </Button>
    </div>
  )
}

function RejectDialog({ caseId, disabled }: { caseId: string; disabled: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<ApiError>()
  const [pending, startTransition] = useTransition()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setError(undefined)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const reason = String(new FormData(event.currentTarget).get("reason")).trim()

    startTransition(async () => {
      const result = await rejectCase(caseId, reason)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setOpen(false)
      toast.add({ title: "Объявление отклонено", type: "success" })
      router.push("/admin/moderation")
    })
  }

  const reasonError = error?.fields?.reason

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="destructive" disabled={disabled} />}>
        <XIcon data-icon="inline-start" />
        Отклонить
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Отклонение объявления</DialogTitle>
            <DialogDescription>
              Объявление не будет опубликовано, а его потребности закроются. Автор получит уведомление с причиной.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            {error && !error.fields && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            <Field data-invalid={Boolean(reasonError)}>
              <FieldLabel htmlFor="reason">Причина</FieldLabel>
              <Textarea
                id="reason"
                name="reason"
                required
                maxLength={500}
                rows={4}
                placeholder="Например: в описании есть контакты для продажи животного"
                aria-invalid={Boolean(reasonError)}
              />
              <FieldDescription>До 500 символов, автор увидит её в уведомлении</FieldDescription>
              <FieldError>{reasonError}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Отклонить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
