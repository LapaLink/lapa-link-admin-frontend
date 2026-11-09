"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"

import { NAVIGATION } from "@/lib/admin/navigation"

// /admin/<section>/<id>: the label of the id segment depends on its section.
const ITEM_LABELS: Record<string, string> = {
  users: "Пользователь",
  moderation: "Объявление",
  complaints: "Жалоба",
  support: "Вопрос",
}

// /admin/users/<id>/<tab>
const USER_TAB_LABELS: Record<string, string> = {
  cases: "Объявления",
  responses: "Отклики",
  events: "События",
  limits: "Лимиты",
}

const SECTION_LABELS = Object.fromEntries(
  NAVIGATION.flatMap((group) => group.items).map((item) => [item.href, item.title])
)

function label(segments: string[], index: number) {
  const segment = segments[index]
  if (index === 1) return SECTION_LABELS[`/admin/${segment}`] ?? segment
  if (index === 2) return ITEM_LABELS[segments[1]] ?? segment
  if (index === 3 && segments[1] === "users") return USER_TAB_LABELS[segment] ?? segment
  return segment
}

/** Path of the current admin page: "Обзор / Жалобы / Жалоба". Nothing is shown on the overview itself. */
export function AdminBreadcrumbs() {
  const segments = (usePathname() ?? "").split("/").filter(Boolean)
  if (segments[0] !== "admin" || segments.length < 2) return null

  const crumbs = [
    { label: "Обзор", href: "/admin" },
    ...segments.slice(1).map((_, offset) => ({
      label: label(segments, offset + 1),
      href: `/${segments.slice(0, offset + 2).join("/")}`,
    })),
  ]

  return (
    <nav aria-label="Навигационная цепочка">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1
          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="underline-offset-4 hover:text-foreground hover:underline">
                  {crumb.label}
                </Link>
              )}
              {!last && <ChevronRightIcon className="size-3.5" aria-hidden />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
