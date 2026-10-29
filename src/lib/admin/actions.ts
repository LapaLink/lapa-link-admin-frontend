"use server"

import { adminGet, adminSend } from "@/lib/admin/api"
import type {
  AdminCase,
  AdminComplaint,
  AdminJob,
  AdminUser,
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

export async function closeCase(caseId: string, reason: string) {
  return adminSend<AdminCase>("POST", `/admin/cases/${encodeURIComponent(caseId)}/close`, { reason })
}

export async function deleteCase(caseId: string) {
  return adminSend("DELETE", `/admin/cases/${encodeURIComponent(caseId)}`)
}

export async function getComplaint(complaintId: string) {
  return adminGet<AdminComplaint>(`/admin/complaints/${encodeURIComponent(complaintId)}`)
}

export async function takeComplaint(complaintId: string) {
  return adminSend<AdminComplaint>("POST", `/admin/complaints/${encodeURIComponent(complaintId)}/take`)
}

export async function rejectComplaint(complaintId: string, comment: string) {
  return adminSend<AdminComplaint>("POST", `/admin/complaints/${encodeURIComponent(complaintId)}/reject`, {
    comment,
  })
}

export async function warnByComplaint(complaintId: string, comment: string) {
  return adminSend<AdminComplaint>("POST", `/admin/complaints/${encodeURIComponent(complaintId)}/warn`, {
    comment,
  })
}

export async function closeComplaintTarget(complaintId: string, comment: string) {
  return adminSend<AdminComplaint>("POST", `/admin/complaints/${encodeURIComponent(complaintId)}/close-target`, {
    comment,
  })
}

export async function grantModerator(userId: string) {
  return adminSend<AdminUser>("PUT", `/admin/users/${encodeURIComponent(userId)}/roles/MODERATOR`)
}

export async function revokeModerator(userId: string) {
  return adminSend<AdminUser>("DELETE", `/admin/users/${encodeURIComponent(userId)}/roles/MODERATOR`)
}

export async function blockUser(userId: string, reason: string) {
  return adminSend<AdminUser>("POST", `/admin/users/${encodeURIComponent(userId)}/block`, { reason })
}

export async function unblockUser(userId: string) {
  return adminSend<AdminUser>("POST", `/admin/users/${encodeURIComponent(userId)}/unblock`)
}

export async function runJob(job: AdminJob) {
  return adminSend("POST", `/admin/jobs/${job}`)
}
