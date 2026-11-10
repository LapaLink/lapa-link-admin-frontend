import { adminGet } from "@/lib/admin/api"
import { getCurrentUser } from "@/lib/auth/current-user"
import { canManageBadges } from "@/lib/auth/privileges"
import type { ApiError, ApiResult } from "@/lib/api/types"
import { BADGES_PATH, badgeCode, badgePath, type AdminBadge, type BadgeMetric } from "./model"

export async function badgeAccessError(): Promise<ApiError | undefined> {
  if (!canManageBadges(await getCurrentUser()))
    return {
      status: 403,
      code: "ACCESS_DENIED",
      message: "Для управления значками нужно право SETTINGS_MANAGE."
    }
}

export async function getBadges(): Promise<ApiResult<AdminBadge[]>> {
  const error = await badgeAccessError()
  return error ? { ok: false, error } : adminGet<AdminBadge[]>(BADGES_PATH)
}

export async function getBadgeMetrics(): Promise<ApiResult<BadgeMetric[]>> {
  const error = await badgeAccessError()
  return error ? { ok: false, error } : adminGet<BadgeMetric[]>(`${BADGES_PATH}/metrics`)
}

export async function getBadge(code: string): Promise<ApiResult<AdminBadge>> {
  const error = await badgeAccessError()
  if (error) return { ok: false, error }
  const parsed = badgeCode.safeParse(code)
  if (!parsed.success)
    return { ok: false, error: { status: 404, code: "BADGE_NOT_FOUND", message: "Значок не найден." } }
  return adminGet<AdminBadge>(badgePath(parsed.data))
}
