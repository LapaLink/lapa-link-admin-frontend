import { z } from "zod"

export const BADGES_PATH = "/admin/badges"
export const HIDDEN_BADGE = "Выключенный значок скрывается у всех пользователей, включая получивших."
export const ACTIVE_BADGE =
  "Значок будет сразу выдан всем, кто уже выполнил условие. Пользователи об этом не уведомляются."
export const AWARDED_BADGE =
  "Этот значок уже получили пользователи. Его можно выключить, чтобы скрыть из каталога."

export const CATEGORY_LABELS = {
  AUTHOR: "Автор",
  HELPER: "Помощник",
  ADOPTION: "Усыновление",
  TRUST: "Доверие",
  COMMUNICATION: "Общение"
} as const

const text = (max: number) => z.string().trim().min(1, "Заполните поле").max(max, `Не больше ${max} символов`)

const integer = (min: number, max: number) =>
  z
    .number({ error: `Введите целое число от ${min} до ${max}` })
    .int(`Введите целое число от ${min} до ${max}`)
    .min(min, `Минимум — ${min}`)
    .max(max, `Максимум — ${max}`)

export const badgeCode = z
  .string()
  .trim()
  .regex(
    /^[A-Z][A-Z0-9_]{2,63}$/,
    "От 3 до 64 символов: заглавные латинские буквы, цифры и _. Начните с буквы."
  )

export const updateBadgeSchema = z.object({
  category: z.enum(Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[], {
    error: "Выберите категорию"
  }),
  threshold: integer(1, 1_000_000),
  sortOrder: integer(0, 10_000),
  icon: z
    .string()
    .trim()
    .regex(/^[a-z0-9_-]{1,64}$/, "До 64 символов: строчные латинские буквы, цифры, дефис или _.")
    .nullable(),
  nameRu: text(100),
  nameBe: text(100),
  descriptionRu: text(300),
  descriptionBe: text(300),
  active: z.boolean()
})

export const createBadgeSchema = updateBadgeSchema.extend({
  code: badgeCode,
  metric: z.string().min(1, "Выберите метрику")
})

export type BadgeInput = z.infer<typeof updateBadgeSchema>
export type NewBadgeInput = z.infer<typeof createBadgeSchema>
// The backend omits null fields, so imageUrl may be absent; it is read-only and never sent back.
export type AdminBadge = NewBadgeInput & { imageUrl?: string | null; awardedCount: number; createdAt: string }

export const BADGE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
export const BADGE_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export type BadgeMetric = { code: string; description: string }

export function badgePath(code: string) {
  return `${BADGES_PATH}/${encodeURIComponent(code)}`
}

export function editableBadge(badge: BadgeInput): BadgeInput {
  const { category, threshold, sortOrder, icon, nameRu, nameBe, descriptionRu, descriptionBe, active } = badge
  return { category, threshold, sortOrder, icon, nameRu, nameBe, descriptionRu, descriptionBe, active }
}
