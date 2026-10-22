import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { backendFetch } from "@/lib/api/backend"
import type { ApiResult } from "@/lib/api/types"
import { ACCESS_COOKIE } from "@/lib/auth/session"

type Query = Record<string, string | undefined>

type Method = "POST" | "PUT" | "DELETE"

export async function adminGet<T>(path: string, query: Query = {}) {
  return adminRequest<T>(`${path}${toQueryString(query)}`)
}

export async function adminSend<T = void>(method: Method, path: string, body?: unknown) {
  return adminRequest<T>(path, method, body)
}

async function adminRequest<T>(path: string, method?: Method, body?: unknown): Promise<ApiResult<T>> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value
  if (!token) {
    redirect("/auth/signout")
  }

  const result = await backendFetch<T>(path, { method, body, token })
  if (!result.ok && result.error.status === 401) {
    redirect(`/auth/signout?reason=${result.error.code ?? "UNAUTHORIZED"}`)
  }
  return result
}

function toQueryString(query: Query) {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  const value = params.toString()
  return value ? `?${value}` : ""
}
