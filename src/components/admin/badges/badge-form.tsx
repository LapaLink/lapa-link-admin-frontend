"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useId, useState, useTransition } from "react"
import { InfoIcon } from "lucide-react"

import { BadgeArtwork } from "@/components/admin/badges/badge-artwork"
import { BadgeImageField } from "@/components/admin/badges/badge-image-field"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { createBadge, updateBadge } from "@/lib/admin/badges/actions"
import { BADGE_ARTWORK_LABELS } from "@/lib/admin/badges/artwork"
import {
  ACTIVE_BADGE,
  BADGES_PATH,
  CATEGORY_LABELS,
  HIDDEN_BADGE,
  createBadgeSchema,
  editableBadge,
  type AdminBadge,
  type BadgeMetric
} from "@/lib/admin/badges/model"

const TEXT_FIELDS = [
  { name: "nameRu", label: "Название на русском", max: 100 },
  { name: "nameBe", label: "Назва па-беларуску", max: 100 },
  { name: "descriptionRu", label: "Описание на русском", max: 300 },
  { name: "descriptionBe", label: "Апісанне па-беларуску", max: 300 }
] as const

function initialValues(badge?: AdminBadge) {
  return {
    code: badge?.code ?? "",
    metric: badge?.metric ?? "",
    category: badge?.category ?? "AUTHOR",
    threshold: String(badge?.threshold ?? 1),
    sortOrder: String(badge?.sortOrder ?? 0),
    icon: badge?.icon ?? "",
    nameRu: badge?.nameRu ?? "",
    nameBe: badge?.nameBe ?? "",
    descriptionRu: badge?.descriptionRu ?? "",
    descriptionBe: badge?.descriptionBe ?? "",
    active: badge?.active ?? true
  }
}

export function BadgeForm({ badge, metrics = [] }: { badge?: AdminBadge; metrics?: BadgeMetric[] }) {
  const router = useRouter()
  const formId = useId()
  const [values, setValues] = useState(() => initialValues(badge))
  const [language, setLanguage] = useState("ru")
  const [customIcon, setCustomIcon] = useState(
    () => !!badge?.icon && !Object.hasOwn(BADGE_ARTWORK_LABELS, badge.icon)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState("")
  const [imageUrl, setImageUrl] = useState(badge?.imageUrl ?? null)
  const [pending, startTransition] = useTransition()

  function setValue<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: "" }))
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setFailure("")
    const parsed = createBadgeSchema.safeParse({
      ...values,
      threshold: values.threshold === "" ? Number.NaN : Number(values.threshold),
      sortOrder: values.sortOrder === "" ? 0 : Number(values.sortOrder),
      icon: values.icon.trim() || null
    })
    if (!parsed.success) {
      const fields: Record<string, string> = {}
      for (const issue of parsed.error.issues)
        if (issue.path.length) fields[String(issue.path[0])] ??= issue.message
      setErrors(fields)
      return
    }
    setErrors({})
    startTransition(async () => {
      const result = badge
        ? await updateBadge(badge.code, editableBadge(parsed.data))
        : await createBadge(parsed.data)
      if (!result.ok) {
        const error = result.error
        if (error.code === "BADGE_NOT_FOUND") {
          toast.add({ title: "Значок не найден", description: error.message, type: "error" })
          router.replace(BADGES_PATH)
        } else if (error.code === "BADGE_ALREADY_EXISTS") {
          setErrors({ code: "Такой код уже есть" })
        } else if (error.code === "UNKNOWN_BADGE_METRIC") {
          setErrors({ metric: "Эта метрика больше недоступна" })
        } else if (error.code === "VALIDATION_FAILED" && error.fields) {
          setErrors(error.fields)
        } else setFailure(error.status === 403 ? "Недостаточно прав" : error.message)
        return
      }
      toast.add({ title: badge ? "Значок сохранён" : "Значок создан", type: "success" })
      router.replace(BADGES_PATH)
    })
  }

  const idFor = (name: string) => `${formId}-${name}`

  function fieldProps(name: keyof typeof values) {
    return {
      id: idFor(name),
      "aria-invalid": !!errors[name],
      "aria-describedby": errors[name] ? idFor(`${name}-error`) : undefined
    }
  }

  function fieldError(name: keyof typeof values) {
    return errors[name] && <FieldError id={idFor(`${name}-error`)}>{errors[name]}</FieldError>
  }

  const previewName = (language === "be" ? values.nameBe : values.nameRu).trim()
  const previewDescription = (language === "be" ? values.descriptionBe : values.descriptionRu).trim()

  return (
    <form
      noValidate
      onSubmit={submit}
      className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <Card>
        <CardHeader>
          <CardTitle>Настройки значка</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {failure && (
              <Alert variant="destructive">
                <AlertDescription>{failure}</AlertDescription>
              </Alert>
            )}
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.code} data-disabled={!!badge}>
                <FieldLabel htmlFor={idFor("code")}>Код</FieldLabel>
                <Input
                  {...fieldProps("code")}
                  value={values.code}
                  maxLength={64}
                  placeholder="CITY_HERO"
                  disabled={!!badge}
                  onChange={(event) => setValue("code", event.target.value)}
                />
                {fieldError("code")}
              </Field>
              <Field data-invalid={!!errors.category}>
                <FieldLabel htmlFor={idFor("category")}>Категория</FieldLabel>
                <NativeSelect
                  {...fieldProps("category")}
                  className="w-full"
                  value={values.category}
                  onChange={(event) => setValue("category", event.target.value as typeof values.category)}
                >
                  {Object.entries(CATEGORY_LABELS).map(([code, label]) => (
                    <NativeSelectOption key={code} value={code}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {fieldError("category")}
              </Field>
            </FieldGroup>
            <Field data-invalid={!!errors.metric} data-disabled={!!badge}>
              <FieldLabel htmlFor={idFor("metric")}>Метрика</FieldLabel>
              {badge ? (
                <Input {...fieldProps("metric")} disabled value={values.metric} />
              ) : (
                <NativeSelect
                  {...fieldProps("metric")}
                  className="w-full"
                  value={values.metric}
                  onChange={(event) => setValue("metric", event.target.value)}
                >
                  <NativeSelectOption value="">Выберите метрику</NativeSelectOption>
                  {metrics.map(({ code, description }) => (
                    <NativeSelectOption key={code} value={code}>
                      {description}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}
              {fieldError("metric")}
            </Field>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  { name: "threshold", label: "Порог выдачи", min: 1, max: 1_000_000 },
                  { name: "sortOrder", label: "Порядок", min: 0, max: 10_000 }
                ] as const
              ).map(({ name, label, min, max }) => (
                <Field key={name} data-invalid={!!errors[name]}>
                  <FieldLabel htmlFor={idFor(name)}>{label}</FieldLabel>
                  <Input
                    {...fieldProps(name)}
                    type="number"
                    min={min}
                    max={max}
                    step={1}
                    value={values[name]}
                    onChange={(event) => setValue(name, event.target.value)}
                  />
                  {fieldError(name)}
                </Field>
              ))}
            </FieldGroup>
            <Field data-invalid={!!errors.icon}>
              <FieldLabel htmlFor={idFor("badge-artwork")}>Иллюстрация</FieldLabel>
              <NativeSelect
                id={idFor("badge-artwork")}
                className="w-full"
                value={customIcon ? "custom" : values.icon}
                onChange={(event) => {
                  const key = event.target.value
                  setCustomIcon(key === "custom")
                  setValue("icon", key === "custom" ? "" : key)
                }}
              >
                <NativeSelectOption value="">Подобрать автоматически</NativeSelectOption>
                {Object.entries(BADGE_ARTWORK_LABELS).map(([key, label]) => (
                  <NativeSelectOption key={key} value={key}>
                    {label}
                  </NativeSelectOption>
                ))}
                <NativeSelectOption value="custom">Указать ключ вручную</NativeSelectOption>
              </NativeSelect>
              {customIcon && (
                <Input
                  {...fieldProps("icon")}
                  aria-label="Ключ иллюстрации"
                  value={values.icon}
                  maxLength={64}
                  onChange={(event) => setValue("icon", event.target.value)}
                />
              )}
              {customIcon && (
                <FieldDescription>
                  Для незнакомого ключа сайт подберёт стандартную иллюстрацию.
                </FieldDescription>
              )}
              {fieldError("icon")}
            </Field>
            {badge ? (
              <BadgeImageField
                badge={{ code: badge.code, category: badge.category, icon: badge.icon, imageUrl }}
                onChange={setImageUrl}
              />
            ) : (
              <Field>
                <FieldLabel>Изображение</FieldLabel>
                <FieldDescription>Загрузить своё изображение можно после создания значка.</FieldDescription>
              </Field>
            )}
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              {TEXT_FIELDS.map(({ name, label, max }) => {
                const props = { ...fieldProps(name), value: values[name], maxLength: max }
                return (
                  <Field key={name} data-invalid={!!errors[name]}>
                    <FieldLabel htmlFor={idFor(name)}>{label}</FieldLabel>
                    {max === 100 ? (
                      <Input {...props} onChange={(event) => setValue(name, event.target.value)} />
                    ) : (
                      <Textarea
                        {...props}
                        rows={3}
                        onChange={(event) => setValue(name, event.target.value)}
                      />
                    )}
                    {fieldError(name)}
                  </Field>
                )
              })}
            </FieldGroup>
            <Field orientation="horizontal">
              <FieldLabel htmlFor={idFor("active")}>Значок включён</FieldLabel>
              <Switch
                {...fieldProps("active")}
                checked={values.active}
                onCheckedChange={(checked) => setValue("active", checked)}
              />
              {fieldError("active")}
            </Field>
            {(values.active || (badge && badge.active !== values.active)) && (
              <Alert>
                <InfoIcon />
                <AlertTitle>
                  {values.active ? "Выдача при сохранении" : "Видимость после сохранения"}
                </AlertTitle>
                <AlertDescription>{values.active ? ACTIVE_BADGE : HIDDEN_BADGE}</AlertDescription>
              </Alert>
            )}
          </FieldGroup>
        </CardContent>
      </Card>
      <Card className="min-w-0 lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle>Предпросмотр</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor={idFor("preview-language")}>Язык</FieldLabel>
            <NativeSelect
              id={idFor("preview-language")}
              className="w-full"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <NativeSelectOption value="ru">Русский</NativeSelectOption>
              <NativeSelectOption value="be">Беларуская</NativeSelectOption>
            </NativeSelect>
          </Field>
          <div className="flex min-w-0 items-start gap-3 rounded-xl border bg-background p-3" lang={language}>
            <BadgeArtwork
              badge={{
                code: values.code.trim(),
                icon: values.icon.trim() || null,
                category: values.category,
                imageUrl
              }}
              size={72}
            />
            <div className="flex min-w-0 flex-col gap-1 [overflow-wrap:anywhere]">
              <p className="font-semibold">
                {previewName || (language === "be" ? "Назва значка" : "Название значка")}
              </p>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                {previewDescription || (language === "be" ? "Апісанне дасягнення" : "Описание достижения")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-wrap justify-end gap-2 lg:col-span-2">
        <Link className={buttonVariants({ variant: "outline" })} href={BADGES_PATH}>
          Отмена
        </Link>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner data-icon="inline-start" />}
          Сохранить
        </Button>
      </div>
    </form>
  )
}
