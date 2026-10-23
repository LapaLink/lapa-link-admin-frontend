"use client"

import { useState, useTransition } from "react"
import { CircleAlertIcon } from "lucide-react"

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
import type { ApiError, ApiResult } from "@/lib/api/types"

type Props = {
  trigger: React.ReactNode
  triggerVariant?: React.ComponentProps<typeof Button>["variant"]
  disabled?: boolean
  title: string
  description: string
  label: string
  hint: string
  placeholder: string
  submitLabel: string
  destructive?: boolean
  successTitle: string
  field: "reason" | "comment"
  onSubmit: (text: string) => Promise<ApiResult<unknown>>
  onSuccess: () => void
}

export function CommentDialog({
  trigger,
  triggerVariant = "outline",
  disabled,
  title,
  description,
  label,
  hint,
  placeholder,
  submitLabel,
  destructive,
  successTitle,
  field,
  onSubmit,
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<ApiError>()
  const [pending, startTransition] = useTransition()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setError(undefined)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = String(new FormData(event.currentTarget).get(field)).trim()

    startTransition(async () => {
      const result = await onSubmit(text)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setOpen(false)
      toast.add({ title: successTitle, type: "success" })
      onSuccess()
    })
  }

  const fieldError = error?.fields?.[field]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant={triggerVariant} size="sm" disabled={disabled} />}>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            {error && !error.fields && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            <Field data-invalid={Boolean(fieldError)}>
              <FieldLabel htmlFor={field}>{label}</FieldLabel>
              <Textarea
                id={field}
                name={field}
                required
                maxLength={500}
                rows={4}
                placeholder={placeholder}
                aria-invalid={Boolean(fieldError)}
              />
              <FieldDescription>{hint}</FieldDescription>
              <FieldError>{fieldError}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
            <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
