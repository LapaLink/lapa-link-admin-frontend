import Link from "next/link"
import { ArrowUpRightIcon, CircleAlertIcon } from "lucide-react"

import { CaseHistory, CaseTabs } from "@/components/admin/case-history"
import { JsonView } from "@/components/admin/json-view"
import { CaseStatusBadge, UserStatusBadge } from "@/components/admin/status-badges"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/lib/admin/format"
import type { AdminComplaint, ComplaintTarget } from "@/lib/api/admin-types"
import type { Privilege } from "@/lib/auth/privileges"
import { cn } from "@/lib/utils"

type CaseTarget = Extract<ComplaintTarget, { type: "CASE" }>
type UserTarget = Extract<ComplaintTarget, { type: "USER" }>
type ConversationTarget = Extract<ComplaintTarget, { type: "CONVERSATION" }>

/** The object a complaint was filed against, rendered by its `type`; unknown types fall back to raw JSON. */
export function ComplaintTargetView({
  target,
  complaint,
  privileges,
}: {
  target: ComplaintTarget
  complaint: AdminComplaint
  privileges: Privilege[]
}) {
  switch (target.type) {
    case "CASE":
      return <CaseTargetView target={target} privileges={privileges} />
    case "USER":
      return <UserTargetView target={target} privileges={privileges} />
    case "CONVERSATION":
      return (
        <ConversationTargetView
          target={target}
          reporterId={complaint.reporterId}
          reviewed={complaint.status !== "NEW" && complaint.status !== "IN_PROGRESS"}
        />
      )
    default:
      return <UnsupportedTargetView target={target} />
  }
}

function CaseTargetView({ target, privileges }: { target: CaseTarget; privileges: Privilege[] }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Объявление</CardDescription>
        <CardTitle>{target.title}</CardTitle>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <CaseStatusBadge status={target.status} />
          {target.closedAt && <span>Закрыто {formatDateTime(target.closedAt)}</span>}
        </div>
      </CardHeader>
      <CardContent>
        <CaseTabs
          history={
            <CaseHistory
              caseId={target.caseId}
              authorId={target.authorId}
              needs={[]}
              canReadUsers={privileges.includes("USER_READ")}
            />
          }
        >
          <p className="line-clamp-4 whitespace-pre-line">{target.description || "—"}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/admin/moderation/${target.caseId}`} />}
            >
              <ArrowUpRightIcon data-icon="inline-start" />
              Полная карточка объявления
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/admin/users/${target.authorId}/cases`} />}
            >
              <ArrowUpRightIcon data-icon="inline-start" />
              Автор объявления
            </Button>
          </div>
        </CaseTabs>
      </CardContent>
    </Card>
  )
}

function UserTargetView({ target, privileges }: { target: UserTarget; privileges: Privilege[] }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Пользователь</CardDescription>
        <CardTitle>{target.displayName ?? "Без имени"}</CardTitle>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <UserStatusBadge status={target.status} />
          <span className="font-mono text-xs">{target.userId}</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {target.displayName && (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/admin/users?${new URLSearchParams({ search: target.displayName })}`} />}
          >
            <ArrowUpRightIcon data-icon="inline-start" />
            В разделе пользователей
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/admin/users/${target.userId}/cases`} />}
        >
          <ArrowUpRightIcon data-icon="inline-start" />
          Объявления
        </Button>
        {privileges.includes("AUDIT_LOG_READ") && (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/admin/users/${target.userId}/events`} />}
          >
            <ArrowUpRightIcon data-icon="inline-start" />
            Журнал событий
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function ConversationTargetView({
  target,
  reporterId,
  reviewed,
}: {
  target: ConversationTarget
  reporterId: string
  reviewed: boolean
}) {
  const deleted = target.chatTitle === null && target.participantIds.length === 0

  return (
    <Card>
      <CardHeader>
        <CardDescription>Чат</CardDescription>
        <CardTitle>
          {target.chatTitle !== null ? `Чат по объявлению «${target.chatTitle}»` : "Чат"}
        </CardTitle>
        <div className="flex flex-col gap-2 text-sm">
          {deleted && (
            <Alert>
              <CircleAlertIcon />
              <AlertTitle>Диалог удалён</AlertTitle>
              <AlertDescription>Ниже — снимок переписки, сохранённый при подаче жалобы.</AlertDescription>
            </Alert>
          )}
          {target.chatTargetType === "CASE" && target.chatTargetId && (
            <Link
              href={`/admin/moderation/${target.chatTargetId}`}
              className="w-fit underline-offset-4 hover:underline"
            >
              Открыть объявление
            </Link>
          )}
          {target.participantIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-muted-foreground">Участники:</span>
              {target.participantIds.map((id) => (
                <Link key={id} href={`/admin/users/${id}/cases`} className="underline-offset-4 hover:underline">
                  {id === reporterId ? "Автор жалобы" : "Второй участник"}{" "}
                  <span className="font-mono text-xs text-muted-foreground">{id}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {target.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {reviewed
              ? "Снимок переписки удалён (хранится 3 дня после рассмотрения жалобы)"
              : "В диалоге не было сообщений"}
          </p>
        ) : (
          <ol className="flex max-h-[36rem] flex-col gap-3 overflow-y-auto rounded-lg border p-3">
            {target.messages.map((message) => {
              const fromReporter = message.senderId === reporterId
              const removed = message.text === null
              return (
                <li
                  key={message.messageId}
                  className={cn(
                    "flex max-w-[80%] flex-col gap-1",
                    fromReporter ? "items-end self-end" : "items-start self-start"
                  )}
                >
                  <span className="text-xs text-muted-foreground">
                    <span className={cn(fromReporter && "font-medium text-foreground")}>
                      {fromReporter ? "Автор жалобы" : "Второй участник"}
                    </span>
                    {" · "}
                    {formatDateTime(message.createdAt)}
                    {message.editedAt && " · изменено"}
                  </span>
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-line",
                      removed
                        ? "bg-muted text-muted-foreground italic"
                        : fromReporter
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                    )}
                  >
                    {removed ? "Сообщение удалено до подачи жалобы" : message.text}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

function UnsupportedTargetView({ target }: { target: unknown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Тип объекта не поддерживается</CardTitle>
      </CardHeader>
      <CardContent>
        <JsonView value={target} />
      </CardContent>
    </Card>
  )
}
