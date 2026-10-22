import type { ApiResult } from "@/lib/api/types"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080"

const FALLBACK_MESSAGE = "Не удалось выполнить запрос. Попробуйте позже."

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  token?: string
}

export async function backendFetch<T>(
  path: string,
  { method = "GET", body, token }: RequestOptions = {}
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { "Accept-Language": "ru" }
  if (body !== undefined) headers["Content-Type"] = "application/json"
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${BACKEND_URL}/api/v1${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    })
  } catch {
    return {
      ok: false,
      error: { status: 0, code: null, message: "Сервер недоступен. Попробуйте позже." },
    }
  }

  const text = await response.text()
  const payload = text ? safeParse(text) : null

  if (response.ok) {
    return { ok: true, data: payload as T }
  }

  const { error, ...fields } = payload?.details ?? {}
  delete fields.errorId
  delete fields.errorCode
  return {
    ok: false,
    error: {
      status: response.status,
      code: error ?? null,
      message: payload?.message ?? FALLBACK_MESSAGE,
      fields: Object.keys(fields).length ? fields : undefined,
    },
  }
}

function safeParse(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
