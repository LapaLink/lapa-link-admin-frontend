import { NextResponse, type NextRequest } from "next/server"

import { ACCESS_COOKIE, REFRESH_COOKIE, refreshTokens, sessionCookies } from "@/lib/auth/session"

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value

  if (request.nextUrl.pathname === "/login") {
    return accessToken
      ? NextResponse.redirect(new URL("/admin", request.url))
      : NextResponse.next()
  }

  if (accessToken) {
    return NextResponse.next()
  }

  const tokens = refreshToken ? await refreshTokens(refreshToken) : null
  if (tokens) {
    const cookies = sessionCookies(tokens)
    cookies.forEach(({ name, value }) => request.cookies.set(name, value))
    const response = NextResponse.next({ request: { headers: request.headers } })
    cookies.forEach((cookie) => response.cookies.set(cookie))
    return response
  }

  const response = NextResponse.redirect(new URL("/login", request.url))
  response.cookies.delete(REFRESH_COOKIE)
  return response
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
}
