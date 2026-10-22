import { NextResponse, type NextRequest } from "next/server"

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session"

export function GET(request: NextRequest) {
  const target = new URL("/login", request.url)
  const reason = request.nextUrl.searchParams.get("reason")
  if (reason) target.searchParams.set("reason", reason)

  const response = NextResponse.redirect(target)
  response.cookies.delete(ACCESS_COOKIE)
  response.cookies.delete(REFRESH_COOKIE)
  return response
}
