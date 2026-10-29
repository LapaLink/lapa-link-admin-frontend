import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowUpRightIcon, ShieldCheckIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { adminGet } from "@/lib/admin/api"
import { formatDateTime } from "@/lib/admin/format"
import { ROLE_LABELS } from "@/lib/admin/labels"
import { getNavigation } from "@/lib/admin/navigation"
import type {
  AdminUser,
  CacheKeys,
  ModerationCase,
  NeedType,
  NotificationTemplate,
  Page,
} from "@/lib/api/admin-types"
import { getCurrentUser } from "@/lib/auth/current-user"
import { getPrivileges } from "@/lib/auth/privileges"

export const metadata: Metadata = {
  title: "Обзор",
}

export default function AdminPage() {
  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Suspense fallback={<Skeleton className="h-44 md:col-span-2" />}>
        <Greeting />
      </Suspense>
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <ShieldCheckIcon />
          </div>
          <CardTitle>Вход защищён MFA</CardTitle>
          <CardDescription>
            Код из приложения-аутентификатора запрашивается при каждом входе. Активна только одна
            сессия: вход в другом браузере завершит текущую.
          </CardDescription>
        </CardHeader>
      </Card>
      <Suspense
        fallback={Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      >
        <Stats />
      </Suspense>
      <h2 className="pt-4 text-lg font-semibold md:col-span-2 xl:col-span-4">Разделы</h2>
      <Suspense fallback={null}>
        <Sections />
      </Suspense>
    </div>
  )
}

async function Sections() {
  const user = await getCurrentUser()
  const sections = getNavigation(getPrivileges(user))
    .flatMap((group) => group.items)
    .filter((item) => item.href !== "/admin")

  return sections.map((section) => (
    <Link
      key={section.href}
      href={section.href}
      className="group/section rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full transition-colors group-hover/section:bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <section.icon />
            </div>
            <ArrowUpRightIcon className="text-muted-foreground transition-transform group-hover/section:translate-x-0.5 group-hover/section:-translate-y-0.5" />
          </div>
          <CardTitle>{section.title}</CardTitle>
          <CardDescription>{section.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  ))
}

async function Greeting() {
  const user = await getCurrentUser()

  return (
    <Card className="relative overflow-hidden md:col-span-2">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_100%_0%,color-mix(in_oklch,var(--brand)_22%,transparent),transparent_65%)]"
      />
      <CardHeader className="relative">
        <CardDescription>{formatGreeting()}</CardDescription>
        <CardTitle className="text-3xl">{user.displayName ?? user.email}</CardTitle>
      </CardHeader>
      <CardContent className="relative flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {user.roles
          .filter((role) => role !== "USER")
          .map((role) => (
            <Badge key={role}>{ROLE_LABELS[role]}</Badge>
          ))}
        <span>Последний вход: {formatDateTime(user.lastLoginAt)}</span>
      </CardContent>
    </Card>
  )
}

async function Stats() {
  const [moderation, users, needTypes, cache, templates] = await Promise.all([
    adminGet<Page<ModerationCase>>("/admin/cases/moderation", { size: "1" }),
    adminGet<Page<AdminUser>>("/admin/users", { size: "1" }),
    adminGet<NeedType[]>("/admin/need-types"),
    adminGet<CacheKeys>("/admin/cache"),
    adminGet<NotificationTemplate[]>("/admin/notification-templates"),
  ])

  const tiles = [
    {
      label: "На модерации",
      value: moderation.ok ? moderation.data.totalElements : null,
      href: "/admin/moderation",
    },
    {
      label: "Пользователей",
      value: users.ok ? users.data.totalElements : null,
      href: "/admin/users",
    },
    {
      label: "Активных типов помощи",
      value: needTypes.ok ? needTypes.data.filter((item) => item.active).length : null,
      hint: needTypes.ok ? `из ${needTypes.data.length}` : undefined,
      href: "/admin/need-types",
    },
    {
      label: "Записей в кэше",
      value: cache.ok ? cache.data.keys.length : null,
      hint: cache.ok && cache.data.truncated ? "показаны первые" : undefined,
      href: "/admin/cache",
    },
    {
      label: "Шаблонов уведомлений",
      value: templates.ok ? templates.data.length : null,
      href: "/admin/notification-templates",
    },
  ]

  return tiles.map((tile) => (
    <Link
      key={tile.href}
      href={tile.href}
      className="group/stat rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full transition-colors group-hover/stat:bg-muted/50">
        <CardHeader>
          <CardDescription>{tile.label}</CardDescription>
          <CardTitle className="flex items-baseline gap-2 text-4xl tabular-nums">
            {tile.value ?? "—"}
            {tile.hint && (
              <span className="text-sm font-normal text-muted-foreground">{tile.hint}</span>
            )}
          </CardTitle>
        </CardHeader>
      </Card>
    </Link>
  ))
}

function formatGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("ru-RU", { hour: "numeric", timeZone: "Europe/Minsk" }).format(new Date())
  )
  if (hour < 6) return "Доброй ночи"
  if (hour < 12) return "Доброе утро"
  if (hour < 18) return "Добрый день"
  return "Добрый вечер"
}
