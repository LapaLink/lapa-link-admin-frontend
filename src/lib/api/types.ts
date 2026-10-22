export type RoleCode = "USER" | "MODERATOR" | "ADMIN"

export type UserStatus =
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "SUSPENDED"
  | "BLOCKED"
  | "DELETED"

export type LoginResponse = {
  accessToken: string | null
  refreshToken: string | null
  mfaRequired: boolean
  mfaSetupRequired: boolean
  mfaToken: string | null
  mfaExpiresInSeconds: number | null
  recoveryCodes: string[] | null
}

export type MfaSetupResponse = {
  secret: string
  otpauthUri: string
}

export type CurrentUser = {
  id: string
  email: string
  displayName: string | null
  status: UserStatus
  locale: string
  roles: RoleCode[]
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  avatarUrl: string | null
}

export type ApiError = {
  status: number
  code: string | null
  message: string
  fields?: Record<string, string>
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }
