import type { Metadata } from "next"
import { Suspense } from "react"
import { PawPrintIcon } from "lucide-react"

import { LoginFlow } from "@/components/auth/login-flow"

export const metadata: Metadata = {
  title: "Вход",
}

const NOTICES: Record<string, string> = {
  SESSION_NOT_FOUND: "Сессия завершена: возможно, выполнен вход в другом браузере. Войдите заново.",
  TOKEN_EXPIRED: "Срок действия сессии истёк. Войдите заново.",
  USER_BLOCKED: "Учётная запись заблокирована.",
  ACCESS_DENIED: "Панель доступна только администраторам и модераторам.",
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="grid flex-1 lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-sidebar p-10 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_20%,color-mix(in_oklch,var(--brand)_35%,transparent),transparent_70%),radial-gradient(50%_50%_at_90%_90%,color-mix(in_oklch,var(--chart-2)_30%,transparent),transparent_70%)]"
        />
        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <PawPrintIcon />
          </div>
          <span className="text-lg font-semibold">ЛапаРядом</span>
        </div>
        <div className="relative flex max-w-md flex-col gap-4">
          <h1 className="text-4xl font-semibold">Панель администратора</h1>
          <p className="text-muted-foreground">
            Пользователи, справочники, кэш и уведомления сервиса помощи животным в одном месте.
          </p>
        </div>
        <p className="relative text-xs text-muted-foreground">
          Вход защищён двухфакторной аутентификацией
        </p>
      </section>
      <section className="flex items-center justify-center p-4 md:p-10">
        <div className="w-full max-w-sm">
          <Suspense>
            <LoginContent searchParams={searchParams} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}

async function LoginContent({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { reason } = await searchParams
  const notice =
    typeof reason === "string" ? (NOTICES[reason] ?? "Войдите заново, чтобы продолжить.") : undefined

  return <LoginFlow notice={notice} />
}
