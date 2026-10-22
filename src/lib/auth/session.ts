import { backendFetch } from "@/lib/api/backend"
import type { LoginResponse } from "@/lib/api/types"

export const ACCESS_COOKIE = "lapa_access"
export const REFRESH_COOKIE = "lapa_refresh"

export type TokenPair = { accessToken: string; refreshToken: string }

const EXPIRY_SKEW_SECONDS = 30

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
}

export function sessionCookies({ accessToken, refreshToken }: TokenPair) {
  return [
    { name: ACCESS_COOKIE, value: accessToken, maxAge: secondsUntilExpiry(accessToken, EXPIRY_SKEW_SECONDS) },
    { name: REFRESH_COOKIE, value: refreshToken, maxAge: secondsUntilExpiry(refreshToken, 0) },
  ].map((cookie) => ({ ...cookie, ...cookieOptions }))
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair | null> {
  const result = await backendFetch<LoginResponse>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  })
  if (!result.ok || !result.data.accessToken || !result.data.refreshToken) {
    return null
  }
  return { accessToken: result.data.accessToken, refreshToken: result.data.refreshToken }
}

function secondsUntilExpiry(jwt: string, skew: number) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"))
    return Math.max(0, payload.exp - skew - Math.floor(Date.now() / 1000))
  } catch {
    return 0
  }
}
