import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { SupportQuestionCard } from "@/components/admin/support-question-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { adminGet } from "@/lib/admin/api"
import type { SupportQuestion } from "@/lib/api/admin-types"
import { getCurrentUser } from "@/lib/auth/current-user"
import { getPrivileges } from "@/lib/auth/privileges"

export const metadata: Metadata = { title: "Вопрос пользователя" }

export default function SupportQuestionPage({ params }: PageProps<"/admin/support/[questionId]">) {
  return (
    <>
      <div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/support" />}>
          <ArrowLeftIcon data-icon="inline-start" />
          Вопросы пользователей
        </Button>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Question params={params} />
      </Suspense>
    </>
  )
}

async function Question({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params
  const [result, user] = await Promise.all([
    adminGet<SupportQuestion>(`/admin/support-questions/${encodeURIComponent(questionId)}`),
    getCurrentUser(),
  ])
  if (!result.ok) return <ApiErrorAlert error={result.error} />

  return (
    <SupportQuestionCard
      key={result.data.updatedAt}
      initial={result.data}
      currentUserId={user.id}
      canReadUsers={getPrivileges(user).includes("USER_READ")}
    />
  )
}
