"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ImageIcon, Trash2Icon, UploadIcon } from "lucide-react"

import { BadgeArtwork } from "@/components/admin/badges/badge-artwork"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { deleteBadgeImage, uploadBadgeImage } from "@/lib/admin/badges/actions"
import {
  BADGES_PATH,
  BADGE_IMAGE_MAX_BYTES,
  BADGE_IMAGE_TYPES,
  type AdminBadge
} from "@/lib/admin/badges/model"
import type { ApiError } from "@/lib/api/types"

const MESSAGES: Record<string, string> = {
  INVALID_IMAGE: "Файл не является изображением JPEG, PNG, GIF или WEBP",
  IMAGE_TOO_LARGE: "Размер изображения не должен превышать 5 МБ",
  ACCESS_DENIED: "Недостаточно прав"
}

/**
 * Upload, replace and delete the image of an existing badge. Each request returns the fresh badge, which is
 * handed to `onChange`, so neither this block nor the form needs a page reload.
 */
export function BadgeImageField({
  badge,
  onChange
}: {
  badge: Pick<AdminBadge, "code" | "category" | "icon" | "imageUrl">
  onChange: (imageUrl: string | null) => void
}) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const hasImage = !!badge.imageUrl

  function fail(apiError: ApiError) {
    if (apiError.code === "BADGE_NOT_FOUND") {
      toast.add({ title: "Бейдж не найден", description: apiError.message, type: "error" })
      router.replace(BADGES_PATH)
      return
    }
    setError(
      (apiError.code && MESSAGES[apiError.code]) ||
        (apiError.status === 403 ? MESSAGES.ACCESS_DENIED : apiError.message)
    )
  }

  function upload(file: File) {
    setError("")
    if (!BADGE_IMAGE_TYPES.includes(file.type)) return setError(MESSAGES.INVALID_IMAGE)
    if (file.size > BADGE_IMAGE_MAX_BYTES) return setError(MESSAGES.IMAGE_TOO_LARGE)
    const body = new FormData()
    body.set("file", file)
    startTransition(async () => {
      const result = await uploadBadgeImage(badge.code, body)
      if (!result.ok) return fail(result.error)
      onChange(result.data.imageUrl ?? null)
      toast.add({ title: hasImage ? "Изображение заменено" : "Изображение загружено", type: "success" })
    })
  }

  function remove() {
    setError("")
    startTransition(async () => {
      const result = await deleteBadgeImage(badge.code)
      if (!result.ok) return fail(result.error)
      onChange(result.data.imageUrl ?? null)
      toast.add({ title: "Изображение удалено", type: "success" })
    })
  }

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>Изображение</FieldLabel>
      <div className="flex flex-wrap items-center gap-4">
        {hasImage ? (
          <BadgeArtwork badge={badge} size={72} />
        ) : (
          <span className="flex size-[72px] shrink-0 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
            <ImageIcon aria-hidden />
          </span>
        )}
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            hidden
            accept={BADGE_IMAGE_TYPES.join(",")}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ""
              if (file) upload(file)
            }}
          />
          <Button type="button" variant="outline" disabled={pending} onClick={() => input.current?.click()}>
            {pending ? <Spinner data-icon="inline-start" /> : <UploadIcon data-icon="inline-start" />}
            {hasImage ? "Заменить" : "Загрузить"}
          </Button>
          {hasImage && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button type="button" variant="ghost" disabled={pending} />}>
                <Trash2Icon data-icon="inline-start" />
                Удалить изображение
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить изображение?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Вместо него снова будет показана стандартная иллюстрация.
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
          )}
        </div>
      </div>
      <FieldDescription>JPEG, PNG, GIF или WEBP, до 5 МБ. Меняется сразу, без кнопки «Сохранить».</FieldDescription>
      <FieldError>{error}</FieldError>
    </Field>
  )
}
