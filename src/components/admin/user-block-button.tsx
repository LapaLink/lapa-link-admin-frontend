"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { BanIcon, CircleAlertIcon, UndoIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { blockUser, unblockUser } from "@/lib/admin/actions"
import type { ApiError } from "@/lib/api/types"

type Props = {
  userId: string
  name: string
  blocked: boolean
  label?: string
}

export function UserBlockButton(props: Props) {
  return props.blocked ? <UnblockButton {...props} /> : <BlockDialog {...props} />
}

function BlockDialog({ userId, name, label = "Заблокировать" }: Props) {
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
      const result = await blockUser(userId, reason)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setOpen(false)
      toast.add({ title: `${name} заблокирован(а)`, type: "success" })
      router.refresh()
    })
  }

  const reasonError = error?.fields?.reason

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <BanIcon data-icon="inline-start" />
        {label}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Блокировка пользователя</DialogTitle>
            <DialogDescription>
              {name} не сможет войти, а текущая сессия перестанет работать сразу. Разблокировать можно в списке
              пользователей.
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
              <FieldLabel htmlFor={`block-reason-${userId}`}>Причина</FieldLabel>
              <Textarea
                id={`block-reason-${userId}`}
                name="reason"
                required
                maxLength={500}
                rows={3}
                placeholder="Например: продажа животных в объявлениях"
                aria-invalid={Boolean(reasonError)}
              />
              <FieldDescription>Сохраняется в журнале событий</FieldDescription>
              <FieldError>{reasonError}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Заблокировать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function UnblockButton({ userId, name }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const result = await unblockUser(userId)
      if (!result.ok) {
        toast.add({ title: "Не удалось разблокировать", description: result.error.message, type: "error" })
        return
      }
      toast.add({ title: `${name} разблокирован(а)`, type: "success" })
      router.refresh()
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" disabled={pending} />}>
        {pending ? <Spinner data-icon="inline-start" /> : <UndoIcon data-icon="inline-start" />}
        Разблокировать
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Разблокировать пользователя?</AlertDialogTitle>
          <AlertDialogDescription>{name} снова сможет входить и пользоваться сервисом.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={submit}>Разблокировать</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
