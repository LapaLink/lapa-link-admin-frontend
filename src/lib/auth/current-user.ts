import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"

import { backendFetch } from "@/lib/api/backend"
import type { CurrentUser } from "@/lib/api/types"
import { ACCESS_COOKIE } from "@/lib/auth/session"

const STAFF_ROLES = ["ADMIN", "MODERATOR"]

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value
  if (!accessToken) {
    redirect("/auth/signout")
  }

  const result = await backendFetch<CurrentUser>("/account/me", { token: accessToken })
  if (!result.ok) {
    if (result.error.status === 401 || result.error.status === 403) {
      redirect(`/auth/signout?reason=${result.error.code ?? "UNAUTHORIZED"}`)
    }
    throw new Error(result.error.message)
  }

  if (!result.data.roles.some((role) => STAFF_ROLES.includes(role))) {
    redirect("/auth/signout?reason=ACCESS_DENIED")
  }
  return result.data
})
