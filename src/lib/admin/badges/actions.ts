"use server"

import type { ZodError } from "zod"
import { revalidatePath } from "next/cache"
import { adminSend } from "@/lib/admin/api"
import type { ApiResult } from "@/lib/api/types"
import { badgeAccessError, getBadge } from "./api"
import {
  BADGES_PATH,
  badgeCode,
  badgePath,
  createBadgeSchema,
  editableBadge,
  updateBadgeSchema,
  type AdminBadge,
  type BadgeInput,
  type NewBadgeInput
} from "./model"

function invalid(error: ZodError): ApiResult<never> {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    if (issue.path.length) fields[String(issue.path[0])] ??= issue.message
  }
  return {
    ok: false,
    error: { status: 400, code: "VALIDATION_FAILED", message: "Проверьте поля формы.", fields }
  }
}

export async function createBadge(input: NewBadgeInput): Promise<ApiResult<AdminBadge>> {
  const error = await badgeAccessError()
  if (error) return { ok: false, error }
  const parsed = createBadgeSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const result = await adminSend<AdminBadge>("POST", BADGES_PATH, parsed.data)
  if (result.ok) revalidatePath(BADGES_PATH)
  return result
}

export async function updateBadge(code: string, input: BadgeInput): Promise<ApiResult<AdminBadge>> {
  const error = await badgeAccessError()
  if (error) return { ok: false, error }
  const parsedCode = badgeCode.safeParse(code)
  if (!parsedCode.success) return invalid(parsedCode.error)
  const parsed = updateBadgeSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const result = await adminSend<AdminBadge>("PUT", badgePath(parsedCode.data), parsed.data)
  if (result.ok || result.error.code === "BADGE_NOT_FOUND") revalidatePath(BADGES_PATH)
  return result
}

export async function setBadgeActivity(code: string, active: boolean): Promise<ApiResult<AdminBadge>> {
  const current = await getBadge(code)
  if (!current.ok || current.data.active === active) return current
  return updateBadge(code, { ...editableBadge(current.data), active })
}

export async function deleteBadge(code: string): Promise<ApiResult<void>> {
  const error = await badgeAccessError()
  if (error) return { ok: false, error }
  const parsed = badgeCode.safeParse(code)
  if (!parsed.success) return invalid(parsed.error)
  const result = await adminSend("DELETE", badgePath(parsed.data))
  if (result.ok) revalidatePath(BADGES_PATH)
  return result
}
