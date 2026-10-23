import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon, FlagIcon } from "lucide-react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { CaseAdminActions } from "@/components/admin/case-admin-actions"
import { ModerationActions } from "@/components/admin/moderation-actions"
import { PageHeader } from "@/components/admin/page-header"
import { CaseStatusBadge } from "@/components/admin/status-badges"
import { UserBlockButton } from "@/components/admin/user-block-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { adminGet } from "@/lib/admin/api"
import { formatDateTime } from "@/lib/admin/format"
import {
  ANIMAL_SEX_LABELS,
  ANIMAL_TYPE_LABELS,
  NEED_PRIORITY_LABELS,
  NEED_STATUS_LABELS,
} from "@/lib/admin/labels"
import type { ModerationCaseDetails } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Проверка объявления" }

export default function ModerationCasePage({ params }: PageProps<"/admin/moderation/[caseId]">) {
  return (
    <>
      <div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/moderation" />}>
          <ArrowLeftIcon data-icon="inline-start" />
          Очередь модерации
        </Button>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ModerationCase params={params} />
      </Suspense>
    </>
  )
}

async function ModerationCase({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params
  const result = await adminGet<ModerationCaseDetails>(`/cases/${encodeURIComponent(caseId)}`)
  if (!result.ok) return <ApiErrorAlert error={result.error} />
  const item = result.data

  return (
    <>
      <PageHeader
        title={item.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <CaseStatusBadge status={item.status} />
            <span>Создано {formatDateTime(item.createdAt)}</span>
            {item.updatedAt !== item.createdAt && <span>· изменено {formatDateTime(item.updatedAt)}</span>}
          </span>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/admin/complaints?status=&targetType=CASE&targetId=${item.id}`} />}
          >
            <FlagIcon data-icon="inline-start" />
            Жалобы
          </Button>
          <CaseAdminActions caseId={item.id} title={item.title} status={item.status} />
          {item.status === "PENDING_REVIEW" && <ModerationActions caseId={item.id} />}
        </div>
      </PageHeader>
      {item.status === "CLOSED" && item.closeComment && (
        <Card>
          <CardHeader>
            <CardTitle>Комментарий при закрытии</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-line">{item.closeComment}</CardContent>
        </Card>
      )}
      {item.status === "REJECTED" && item.rejectionReason && (
        <Card>
          <CardHeader>
            <CardTitle>Причина отклонения</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-line">{item.rejectionReason}</CardContent>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Описание</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="whitespace-pre-line">{item.description || "—"}</p>
            {item.condition && (
              <div>
                <div className="text-sm text-muted-foreground">Состояние</div>
                <p className="whitespace-pre-line">{item.condition}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Данные</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Автор</dt>
              <dd className="flex flex-col items-start gap-1">
                <Link href={`/admin/users/${item.author.id}`} className="underline-offset-4 hover:underline">
                  {item.author.displayName ?? item.author.id}
                </Link>
                <UserBlockButton
                  userId={item.author.id}
                  name={item.author.displayName ?? "Автор"}
                  blocked={false}
                  label="Заблокировать автора"
                />
              </dd>
              <dt className="text-muted-foreground">Животное</dt>
              <dd>{ANIMAL_TYPE_LABELS[item.animalType] ?? item.animalType}</dd>
              <dt className="text-muted-foreground">Пол</dt>
              <dd>{ANIMAL_SEX_LABELS[item.sex] ?? item.sex}</dd>
              <dt className="text-muted-foreground">Возраст</dt>
              <dd>{item.approximateAge ?? "—"}</dd>
              <dt className="text-muted-foreground">Город</dt>
              <dd>{item.cityCode ?? "—"}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Фото</CardTitle>
        </CardHeader>
        <CardContent>
          {item.photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Фото не загружены</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {item.photos.map((photo) => (
                <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={item.title}
                    className="aspect-square w-full rounded-lg border object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Потребности</CardTitle>
        </CardHeader>
        <CardContent>
          {item.needs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Потребности не добавлены</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {item.needs.map((need) => (
                <li key={need.id} className="flex flex-col gap-1 rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs">{need.type}</span>
                    <Badge variant="outline">{NEED_STATUS_LABELS[need.status]}</Badge>
                    <Badge variant="secondary">Приоритет: {NEED_PRIORITY_LABELS[need.priority] ?? need.priority}</Badge>
                  </div>
                  {need.comment && <p className="text-sm whitespace-pre-line">{need.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}
