import type { AdminBadge } from "./model"

// Keep the static artwork and its keys aligned with the user-facing frontend.
export const BADGE_ARTWORK_LABELS = {
  author: "Кот",
  "caring-author": "Сердце с лапой",
  "home-found": "Ключ",
  helper: "Собака",
  "helped-in-deed": "Миска",
  "reliable-helper": "Лапа с галочкой",
  volunteer: "Кубок",
  adoption: "Дом",
  "stay-in-touch": "Телефон",
  trust: "Щит",
  communication: "Диалог",
  award: "Лапа"
} as const

const byCategory = {
  AUTHOR: "author",
  HELPER: "helper",
  ADOPTION: "adoption",
  TRUST: "trust",
  COMMUNICATION: "communication"
} as const

const byCode = new Map([
  ["FIRST_CASE", "author"],
  ["CARING_AUTHOR", "caring-author"],
  ["HOME_FOUND", "home-found"],
  ["READY_TO_HELP", "helper"],
  ["HELPED_IN_DEED", "helped-in-deed"],
  ["RELIABLE_HELPER", "reliable-helper"],
  ["VOLUNTEER", "volunteer"],
  ["WANT_HOME", "adoption"],
  ["STAY_IN_TOUCH", "stay-in-touch"],
  ["SAFE_LOGIN", "trust"],
  ["RESPONSIVE", "communication"]
])

const aliases = new Map([
  ["heart-handshake", "helper"],
  ["house", "adoption"],
  ["home", "adoption"],
  ["medal", "award"],
  ["message-circle", "communication"],
  ["paw-print", "author"],
  ["shield", "trust"],
  ["star", "award"],
  ["trophy", "volunteer"]
])

export function badgeArtworkPath({ icon, code, category }: Pick<AdminBadge, "icon" | "code" | "category">) {
  if (icon && Object.hasOwn(BADGE_ARTWORK_LABELS, icon)) return `/badges/${icon}.svg`
  const artwork =
    (icon ? aliases.get(icon) : undefined) ?? byCode.get(code) ?? byCategory[category] ?? "award"
  return `/badges/${artwork}.svg`
}
