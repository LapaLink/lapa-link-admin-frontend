"use server"

import { adminGet, adminSend } from "@/lib/admin/api"
import type {
  AdminJob,
  CacheEntry,
  CacheType,
  NeedType,
  NotificationTemplate,
  NotificationTemplateContent,
} from "@/lib/api/admin-types"

export type NeedTypeInput = {
  nameRu: string
  nameBe: string
  sortOrder: number
}

export async function createNeedType(input: NeedTypeInput & { code: string }) {
  return adminSend<NeedType>("POST", "/admin/need-types", input)
}

export async function updateNeedType(code: string, input: NeedTypeInput & { active: boolean }) {
  return adminSend<NeedType>("PUT", `/admin/need-types/${encodeURIComponent(code)}`, input)
}

export async function getCacheEntry(type: CacheType, key: string) {
  return adminGet<CacheEntry>(`/admin/cache/${type}/entry`, { key })
}

export async function evictCacheEntry(type: CacheType, key: string) {
  return adminSend("DELETE", `/admin/cache/${type}/entry?${new URLSearchParams({ key })}`)
}

export async function getNotificationTemplate(
  eventType: string,
  channel: NotificationTemplate["channel"],
  locale: NotificationTemplate["locales"][number]
) {
  return adminGet<NotificationTemplateContent>(
    `/admin/notification-templates/${encodeURIComponent(eventType)}/${channel}/${locale}`
  )
}

export async function approveCase(caseId: string) {
  return adminSend("POST", `/admin/cases/${encodeURIComponent(caseId)}/approve`)
}

export async function rejectCase(caseId: string, reason: string) {
  return adminSend("POST", `/admin/cases/${encodeURIComponent(caseId)}/reject`, { reason })
}

export async function runJob(job: AdminJob) {
  return adminSend("POST", `/admin/jobs/${job}`)
}
