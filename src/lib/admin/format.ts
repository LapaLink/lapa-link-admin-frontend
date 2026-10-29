const TIME_ZONE = "Europe/Minsk"
const TIME_ZONE_OFFSET = "+03:00"

const dateTimeFormat = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: TIME_ZONE,
})

export function formatDateTime(value: string | null | undefined) {
  return value ? dateTimeFormat.format(new Date(value)) : "—"
}

const localDateTimeFormat = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: TIME_ZONE,
})

/** Formats a date as a `datetime-local` input value in the admin time zone. */
export function toLocalDateTime(date: Date) {
  return localDateTimeFormat.format(date).replace(" ", "T")
}

/** The earliest `datetime-local` value within the last `days` days. */
export function localDateTimeDaysAgo(days: number) {
  return toLocalDateTime(new Date(Date.now() - days * 24 * 60 * 60 * 1000))
}

export function localDateTimeToInstant(value: string | undefined) {
  if (!value) return undefined
  const date = new Date(`${value.length === 16 ? `${value}:00` : value}${TIME_ZONE_OFFSET}`)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export type SearchParams = Record<string, string | string[] | undefined>

export function pickParams<K extends string>(params: SearchParams, keys: readonly K[]) {
  return Object.fromEntries(
    keys.map((key) => {
      const value = params[key]
      return [key, (Array.isArray(value) ? value[0] : value) || undefined]
    })
  ) as Record<K, string | undefined>
}
