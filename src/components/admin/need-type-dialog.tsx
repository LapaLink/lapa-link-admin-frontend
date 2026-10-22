"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CircleAlertIcon, PencilIcon, PlusIcon } from "lucide-react"

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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { createNeedType, updateNeedType } from "@/lib/admin/actions"
import type { NeedType } from "@/lib/api/admin-types"
import type { ApiError } from "@/lib/api/types"

export function NeedTypeDialog({ needType }: { needType?: NeedType }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<ApiError>()
  const [pending, startTransition] = useTransition()
  const editing = Boolean(needType)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setError(undefined)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = {
      nameRu: String(form.get("nameRu")).trim(),
      nameBe: String(form.get("nameBe")).trim(),
      sortOrder: Number(form.get("sortOrder")),
    }

    startTransition(async () => {
      const result = needType
        ? await updateNeedType(needType.code, { ...input, active: form.get("active") === "on" })
        : await createNeedType({ ...input, code: String(form.get("code")).trim() })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setOpen(false)
      toast.add({ title: editing ? "Тип помощи сохранён" : "Тип помощи создан", type: "success" })
      router.refresh()
    })
  }

  const fieldError = (name: string) => error?.fields?.[name]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {needType ? (
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>
          <PencilIcon data-icon="inline-start" />
          Изменить
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <PlusIcon data-icon="inline-start" />
          Добавить тип
        </DialogTrigger>
      )}
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{editing ? "Изменение типа помощи" : "Новый тип помощи"}</DialogTitle>
            <DialogDescription>
              {editing ? `Код ${needType?.code} не меняется.` : "Код нельзя изменить после создания."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            {error && !error.fields && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            {!editing && (
              <Field data-invalid={Boolean(fieldError("code"))}>
                <FieldLabel htmlFor="code">Код</FieldLabel>
                <Input
                  id="code"
                  name="code"
                  required
                  maxLength={32}
                  pattern="[A-Z][A-Z0-9_]{0,31}"
                  placeholder="VET_VISIT"
                  className="font-mono"
                  aria-invalid={Boolean(fieldError("code"))}
                />
                <FieldDescription>Заглавные латинские буквы, цифры и _, начинается с буквы</FieldDescription>
                <FieldError>{fieldError("code")}</FieldError>
              </Field>
            )}
            <Field data-invalid={Boolean(fieldError("nameRu"))}>
              <FieldLabel htmlFor="nameRu">Название на русском</FieldLabel>
              <Input
                id="nameRu"
                name="nameRu"
                required
                maxLength={100}
                defaultValue={needType?.nameRu}
                aria-invalid={Boolean(fieldError("nameRu"))}
              />
              <FieldError>{fieldError("nameRu")}</FieldError>
            </Field>
            <Field data-invalid={Boolean(fieldError("nameBe"))}>
              <FieldLabel htmlFor="nameBe">Название на белорусском</FieldLabel>
              <Input
                id="nameBe"
                name="nameBe"
                required
                maxLength={100}
                defaultValue={needType?.nameBe}
                aria-invalid={Boolean(fieldError("nameBe"))}
              />
              <FieldError>{fieldError("nameBe")}</FieldError>
            </Field>
            <Field data-invalid={Boolean(fieldError("sortOrder"))}>
              <FieldLabel htmlFor="sortOrder">Порядок отображения</FieldLabel>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                required
                step={1}
                defaultValue={needType?.sortOrder}
                aria-invalid={Boolean(fieldError("sortOrder"))}
              />
              <FieldDescription>Типы сортируются по возрастанию</FieldDescription>
              <FieldError>{fieldError("sortOrder")}</FieldError>
            </Field>
            {needType && (
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="active">Активен</FieldLabel>
                  <FieldDescription>Доступен для новых потребностей</FieldDescription>
                </FieldContent>
                <Switch id="active" name="active" defaultChecked={needType.active} />
              </Field>
            )}
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
