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
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { createLimit, updateLimit } from "@/lib/admin/actions"
import { describeLimit } from "@/lib/admin/limits"
import {
  AUDIT_ACTION_LABELS,
  LIMIT_BAN_TYPE_LABELS,
  TIME_UNIT_LABELS,
} from "@/lib/admin/labels"
import {
  TIME_UNITS,
  type LimitBanType,
  type LimitType,
  type OperationLimit,
  type OperationLimitInput,
  type TimeUnit,
} from "@/lib/api/admin-types"
import type { ApiError } from "@/lib/api/types"

type Form = {
  limitType: string
  enabled: boolean
  description: string
  maxCount: string
  windowSize: string
  timeUnit: string
  auditAction: string
  limitBanType: string
  banDuration: string
}

function initialForm(limit: OperationLimit | undefined): Form {
  return {
    limitType: limit?.limitType ?? "",
    enabled: limit?.enabled ?? true,
    description: limit?.description ?? "",
    maxCount: String(limit?.maxCount ?? 5),
    windowSize: String(limit?.windowSize ?? 1),
    timeUnit: limit?.timeUnit ?? "DAYS",
    auditAction: limit?.auditAction ?? "",
    limitBanType: limit?.limitBanType ?? "ACTION",
    banDuration: String(limit?.banDuration ?? 1),
  }
}

/**
 * Create (`limit` omitted) or edit a rule. A rule is bound to one audit action; actions already used by
 * other rules (`limits`) can't be picked again.
 */
export function LimitDialog({
  limit,
  limits,
  auditActions,
}: {
  limit?: OperationLimit
  limits: OperationLimit[]
  auditActions: string[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<ApiError>()
  const [form, setForm] = useState(() => initialForm(limit))
  const [pending, startTransition] = useTransition()
  const permanent = form.limitBanType === "PERMANENT"
  const taken = new Set(limits.filter((item) => item.limitType !== limit?.limitType).map((item) => item.auditAction))

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setError(undefined)
      setForm(initialForm(limit))
    }
  }

  const set = (patch: Partial<Form>) => setForm((current) => ({ ...current, ...patch }))

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input: OperationLimitInput = {
      enabled: form.enabled,
      description: form.description.trim() || undefined,
      maxCount: Number(form.maxCount),
      windowSize: Number(form.windowSize),
      timeUnit: form.timeUnit as TimeUnit,
      auditAction: form.auditAction,
      limitBanType: form.limitBanType as LimitBanType,
      banDuration: permanent ? undefined : Number(form.banDuration),
    }

    startTransition(async () => {
      const result = limit
        ? await updateLimit(limit.limitType, input)
        : await createLimit({ ...input, limitType: form.limitType as LimitType })
      if (!result.ok) {
        if (result.error.code === "OPERATION_LIMIT_NOT_FOUND") {
          setOpen(false)
          toast.add({ title: "Правило уже удалено", description: result.error.message, type: "error" })
          router.refresh()
          return
        }
        if (result.error.code === "OPERATION_LIMIT_ALREADY_EXISTS" || result.error.code === "OPERATION_LIMIT_ACTION_TAKEN") {
          router.refresh()
        }
        setError(result.error)
        return
      }
      setOpen(false)
      toast.add({ title: limit ? "Правило сохранено" : "Правило создано", type: "success" })
      router.refresh()
    })
  }

  const fieldError = (name: string) => error?.fields?.[name]
  const summary = describeLimit({ ...form, maxCount: Number(form.maxCount), windowSize: Number(form.windowSize), banDuration: Number(form.banDuration) })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {limit ? (
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>
          <PencilIcon data-icon="inline-start" />
          Изменить
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <PlusIcon data-icon="inline-start" />
          Добавить правило
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{limit ? "Изменение правила" : "Новое правило"}</DialogTitle>
            <DialogDescription>
              {limit
                ? "Накопленные счётчики пользователей не сбрасываются."
                : "Правило привязывается к действию аудита: у одного действия может быть только одно правило."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            {error && !error.fields && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            <Field data-invalid={Boolean(fieldError("limitType"))}>
              <FieldLabel htmlFor="limitType">Код правила</FieldLabel>
              <Input
                id="limitType"
                required
                minLength={2}
                maxLength={64}
                pattern="[A-Z][A-Z0-9_]{1,63}"
                placeholder="CASE_NEW_REQUEST"
                className="font-mono"
                readOnly={Boolean(limit)}
                value={form.limitType}
                onChange={(event) => set({ limitType: event.target.value })}
                aria-invalid={Boolean(fieldError("limitType"))}
              />
              <FieldDescription>
                Заглавные латинские буквы, цифры и _, начинается с буквы, 2–64 символа. После создания не меняется
              </FieldDescription>
              <FieldError>{fieldError("limitType")}</FieldError>
            </Field>
            <Field data-invalid={Boolean(fieldError("auditAction"))}>
              <FieldLabel htmlFor="auditAction">Действие аудита</FieldLabel>
              <NativeSelect
                id="auditAction"
                required
                value={form.auditAction}
                onChange={(event) => set({ auditAction: event.target.value })}
              >
                <NativeSelectOption value="">Выберите действие</NativeSelectOption>
                {auditActions.map((action) => (
                  <NativeSelectOption key={action} value={action} disabled={taken.has(action)}>
                    {(AUDIT_ACTION_LABELS as Record<string, string>)[action] ?? action}
                    {taken.has(action) ? " (занято)" : ""}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>
                Лимит действует на пользователей, которые выполняют операцию с этим действием, например CASE_CREATED —
                создание объявления. Действия сотрудников (модераторов, админов) и запросы без авторизации лимит не
                затрагивает
              </FieldDescription>
              <FieldError>{fieldError("auditAction")}</FieldError>
            </Field>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="enabled">Включено</FieldLabel>
                <FieldDescription>Выключенное правило не действует, но сохраняется</FieldDescription>
              </FieldContent>
              <Switch id="enabled" checked={form.enabled} onCheckedChange={(enabled) => set({ enabled })} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field data-invalid={Boolean(fieldError("maxCount"))}>
                <FieldLabel htmlFor="maxCount">Раз</FieldLabel>
                <Input
                  id="maxCount"
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={form.maxCount}
                  onChange={(event) => set({ maxCount: event.target.value })}
                  aria-invalid={Boolean(fieldError("maxCount"))}
                />
                <FieldError>{fieldError("maxCount")}</FieldError>
              </Field>
              <Field data-invalid={Boolean(fieldError("windowSize"))}>
                <FieldLabel htmlFor="windowSize">За окно</FieldLabel>
                <Input
                  id="windowSize"
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={form.windowSize}
                  onChange={(event) => set({ windowSize: event.target.value })}
                  aria-invalid={Boolean(fieldError("windowSize"))}
                />
                <FieldError>{fieldError("windowSize")}</FieldError>
              </Field>
              <Field data-invalid={Boolean(fieldError("timeUnit"))}>
                <FieldLabel htmlFor="timeUnit">Единица</FieldLabel>
                <NativeSelect id="timeUnit" value={form.timeUnit} onChange={(event) => set({ timeUnit: event.target.value })}>
                  {TIME_UNITS.map((unit) => (
                    <NativeSelectOption key={unit} value={unit}>
                      {TIME_UNIT_LABELS[unit]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError>{fieldError("timeUnit")}</FieldError>
              </Field>
            </div>
            <Field data-invalid={Boolean(fieldError("limitBanType"))}>
              <FieldLabel htmlFor="limitBanType">При превышении</FieldLabel>
              <NativeSelect
                id="limitBanType"
                value={form.limitBanType}
                onChange={(event) => set({ limitBanType: event.target.value })}
              >
                {Object.entries(LIMIT_BAN_TYPE_LABELS).map(([value, text]) => (
                  <NativeSelectOption key={value} value={value}>
                    {text}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError>{fieldError("limitBanType")}</FieldError>
            </Field>
            {!permanent && (
              <Field data-invalid={Boolean(fieldError("banDuration"))}>
                <FieldLabel htmlFor="banDuration">Длительность бана</FieldLabel>
                <Input
                  id="banDuration"
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={form.banDuration}
                  onChange={(event) => set({ banDuration: event.target.value })}
                  aria-invalid={Boolean(fieldError("banDuration"))}
                />
                <FieldDescription>В той же единице, что и окно</FieldDescription>
                <FieldError>{fieldError("banDuration")}</FieldError>
              </Field>
            )}
            <Field data-invalid={Boolean(fieldError("description"))}>
              <FieldLabel htmlFor="description">Описание</FieldLabel>
              <Textarea
                id="description"
                rows={2}
                maxLength={500}
                value={form.description}
                onChange={(event) => set({ description: event.target.value })}
                aria-invalid={Boolean(fieldError("description"))}
              />
              <FieldDescription className="tabular-nums">{form.description.length}/500</FieldDescription>
              <FieldError>{fieldError("description")}</FieldError>
            </Field>
            {summary && <p className="rounded-lg bg-muted p-3 text-sm">{summary}</p>}
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
            <Button type="submit" disabled={pending || !form.limitType || !form.auditAction}>
              {pending && <Spinner data-icon="inline-start" />}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
