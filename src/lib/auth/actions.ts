"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { backendFetch } from "@/lib/api/backend"
import type { ApiError, LoginResponse, MfaSetupResponse } from "@/lib/api/types"
import { ACCESS_COOKIE, REFRESH_COOKIE, sessionCookies } from "@/lib/auth/session"

export type LoginState =
  | { status: "error"; error: ApiError }
  | {
      status: "mfa"
      mfaToken: string
      setup: MfaSetupResponse | null
      expiresAt: number
    }

export type MfaVerifyState =
  | { status: "error"; error: ApiError }
  | { status: "recovery-codes"; recoveryCodes: string[] }

const STAFF_ONLY: ApiError = {
  status: 403,
  code: "ACCESS_DENIED",
  message: "Панель доступна только администраторам и модераторам.",
}

export async function login(email: string, password: string): Promise<LoginState> {
  const result = await backendFetch<LoginResponse>("/auth/admin/login", {
    method: "POST",
    body: { email, password },
  })
  if (!result.ok) {
    return { status: "error", error: result.error.code === "ACCESS_DENIED" ? STAFF_ONLY : result.error }
  }

  const { mfaRequired, mfaToken, mfaSetupRequired, mfaExpiresInSeconds } = result.data
  if (!mfaRequired || !mfaToken) {
    return { status: "error", error: STAFF_ONLY }
  }

  const expiresAt = Date.now() + (mfaExpiresInSeconds ?? 300) * 1000
  if (!mfaSetupRequired) {
    return { status: "mfa", mfaToken, setup: null, expiresAt }
  }

  const setup = await backendFetch<MfaSetupResponse>("/auth/admin/login/mfa/setup", {
    method: "POST",
    body: { mfaToken },
  })
  if (!setup.ok) {
    return { status: "error", error: setup.error }
  }
  return { status: "mfa", mfaToken, setup: setup.data, expiresAt }
}

export async function verifyMfa(mfaToken: string, code: string): Promise<MfaVerifyState> {
  const result = await backendFetch<LoginResponse>("/auth/admin/login/mfa", {
    method: "POST",
    body: { mfaToken, code },
  })
  if (!result.ok) {
    return { status: "error", error: result.error.code === "ACCESS_DENIED" ? STAFF_ONLY : result.error }
  }

  const { accessToken, refreshToken, recoveryCodes } = result.data
  if (!accessToken || !refreshToken) {
    return { status: "error", error: STAFF_ONLY }
  }

  const store = await cookies()
  sessionCookies({ accessToken, refreshToken }).forEach((cookie) => store.set(cookie))

  if (recoveryCodes?.length) {
    return { status: "recovery-codes", recoveryCodes }
  }
  redirect("/admin")
}

export async function logout() {
  const store = await cookies()
  const accessToken = store.get(ACCESS_COOKIE)?.value
  if (accessToken) {
    await backendFetch("/account/logout", { method: "POST", token: accessToken })
  }
  store.delete(ACCESS_COOKIE)
  store.delete(REFRESH_COOKIE)
  redirect("/login")
}
