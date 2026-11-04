import { pluralRu } from "@/lib/admin/format"
import { TIME_UNIT_FORMS } from "@/lib/admin/labels"

const positive = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0

/** "5 дней"; an unknown unit is shown as is. */
export function formatInterval(value: number, unit: string) {
  const forms = TIME_UNIT_FORMS[unit]
  return `${value} ${forms ? pluralRu(value, forms) : unit}`
}

/** One-line summary of a rule, e.g. "До 5 раз за 1 день; при превышении — операция недоступна 1 день". */
export function describeLimit(rule: {
  maxCount: number
  windowSize: number
  timeUnit: string
  limitBanType: string
  banDuration?: number | null
}) {
  if (!positive(rule.maxCount) || !positive(rule.windowSize)) return ""
  const base = `До ${rule.maxCount} раз за ${formatInterval(rule.windowSize, rule.timeUnit)}; при превышении — `
  if (rule.limitBanType === "PERMANENT") return `${base}аккаунт блокируется бессрочно до решения администратора`
  if (!positive(rule.banDuration)) return ""
  const duration = formatInterval(rule.banDuration, rule.timeUnit)
  if (rule.limitBanType === "ACTION") return `${base}операция недоступна ${duration}`
  if (rule.limitBanType === "ACCOUNT") return `${base}аккаунт приостановлен на ${duration}`
  return `${base}${rule.limitBanType}`
}
