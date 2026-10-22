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
