import type { RoleCode, UserStatus } from "@/lib/api/types"

export type Page<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export type AdminUser = {
  id: string
  email: string
  displayName: string | null
  status: UserStatus
  locale: string
  roles: RoleCode[]
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
}

export type CaseStatus = "OPEN" | "CLOSED"

export type AnimalType = "CAT" | "DOG"

export type UserCase = {
  id: string
  animalType: AnimalType
  title: string
  cityCode: string | null
  photoUrl: string | null
  status: CaseStatus
  createdAt: string
  openNeedsCount: number
  applicationsCount: number
}

export type HelpApplicationStatus = "PENDING" | "ACCEPTED" | "CANCELLED"

export type NeedStatus = "OPEN" | "ASSIGNED" | "CLOSED"

export type NeedPriority = "LOW" | "MEDIUM" | "HIGH"

export type UserHelpApplication = {
  id: string
  status: HelpApplicationStatus
  message: string | null
  need: {
    id: string
    caseId: string
    type: string
    status: NeedStatus
    priority: NeedPriority
    startsAt: string | null
    deadline: string | null
    comment: string | null
  }
  animalCase: { id: string; title: string; photoUrl: string | null }
  createdAt: string
}

export const AUDIT_ACTIONS = [
  "USER_REGISTERED",
  "USER_LOGIN",
  "USER_PASSWORD_CHANGED",
  "USER_OTP_CONFIRMED",
  "USER_PASSWORD_RESET",
  "USER_EMAIL_CHANGED",
  "USER_PROFILE_UPDATED",
  "USER_DELETED",
  "USER_MFA_SETUP_STARTED",
  "USER_MFA_LOGIN",
  "CASE_CREATED",
  "CASE_CLOSED",
  "HELP_APPLICATION_CREATED",
  "CONVERSATION_REQUESTED",
  "CONVERSATION_ACCEPTED",
  "CONVERSATION_DECLINED",
  "CONVERSATION_CLOSED",
  "CONVERSATION_REOPENED",
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export type AuditOutcome = "SUCCESS" | "FAILURE"

export type AuditLogEntry = {
  id: string
  occurredAt: string
  actorType: "USER" | "SYSTEM"
  actorId: string | null
  actorRole: RoleCode | null
  action: AuditAction
  targetType: "USER" | "CASE" | "HELP_APPLICATION" | "CONVERSATION" | null
  targetId: string | null
  outcome: AuditOutcome
  errorCode: string | null
  reason: string | null
  changes: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  requestId: string | null
  ip: string | null
}

export const CACHE_TYPES = [
  "OTP_CACHE",
  "OTP_ACTIVE_REQUEST",
  "OTP_RESEND_COOLDOWN",
  "OTP_ATTEMPTS",
  "OTP_DAILY_REQUESTS",
  "OTP_DAILY_FAILURES",
  "USER_SESSION",
  "USER_ACTIVE_TOKEN",
  "OTP_CONFIRMATION",
  "MFA_CHALLENGE",
  "MFA_ATTEMPTS",
  "IP_NO_TOKEN_COUNT",
  "IP_RATE_LIMIT_COUNT",
  "IP_BLOCKED",
  "HELP_OFFER_MATCHED_EMAILS",
  "ROLE",
  "ALL_CITIES",
  "ACTIVE_NEED_TYPES",
  "ALL_CASE_CLOSE_REASONS",
  "MY_CONTENT_VERSION",
  "MY_CASES",
  "MY_HELP_APPLICATIONS",
] as const

export type CacheType = (typeof CACHE_TYPES)[number]

export type CacheKeys = {
  keys: { type: CacheType; key: string }[]
  truncated: boolean
}

export type CacheEntry = {
  type: CacheType
  key: string
  ttlSeconds: number | null
  masked: boolean
  value: unknown
}

export type NotificationTemplate = {
  eventType: string
  channel: "EMAIL" | "IN_APP"
  locales: ("RU" | "BE")[]
}

export type NotificationTemplateContent = {
  eventType: string
  channel: NotificationTemplate["channel"]
  locale: NotificationTemplate["locales"][number]
  content: string
}

export const ADMIN_JOBS = [
  "NOTIFICATION_CLEANUP",
  "AUDIT_PARTITIONS",
  "NOTIFICATION_TEMPLATES_REFRESH",
] as const

export type AdminJob = (typeof ADMIN_JOBS)[number]

export type NeedType = {
  code: string
  nameRu: string
  nameBe: string
  sortOrder: number
  active: boolean
}
