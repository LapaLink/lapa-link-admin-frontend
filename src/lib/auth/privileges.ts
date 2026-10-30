import type { CurrentUser, RoleCode } from "@/lib/api/types"

export type Privilege =
  | "AUDIT_LOG_READ"
  | "CONTENT_MODERATE"
  | "DICTIONARY_MANAGE"
  | "SETTINGS_MANAGE"
  | "USER_READ"

// /account/me returns only roles; this mirrors the backend role → privilege mapping (V025__privileges.sql).
// It only decides what to show: the backend still answers 403 ACCESS_DENIED on its own.
const ROLE_PRIVILEGES: Record<RoleCode, Privilege[]> = {
  USER: [],
  MODERATOR: ["CONTENT_MODERATE"],
  ADMIN: ["AUDIT_LOG_READ", "CONTENT_MODERATE", "DICTIONARY_MANAGE", "SETTINGS_MANAGE", "USER_READ"],
}

export function getPrivileges(user: CurrentUser): Privilege[] {
  return [...new Set(user.roles.flatMap((role) => ROLE_PRIVILEGES[role] ?? []))]
}
