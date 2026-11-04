"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HandIcon, LockIcon, RefreshCwIcon, SendIcon } from "lucide-react"

import { PageHeader } from "@/components/admin/page-header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { closeSupportQuestion, getChatMessages, takeSupportQuestion } from "@/lib/admin/actions"
import { formatDateTime } from "@/lib/admin/format"
import { SUPPORT_QUESTION_STATUS_LABELS } from "@/lib/admin/labels"
import type { ChatMessage, SupportQuestion } from "@/lib/api/admin-types"
import type { ApiError, ApiResult } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { useChatSocket } from "@/hooks/use-chat-socket"

/**
 * Support question card: take, close and the conversation. History comes from REST, new messages,
 * edits and deletions arrive over STOMP; writing is possible only while the question is in progress.
 */
export function SupportQuestionCard({
  initial,
  currentUserId,
  canReadUsers,
}: {
  initial: SupportQuestion
  currentUserId: string
  canReadUsers: boolean
}) {
  const router = useRouter()
  const [question, setQuestion] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [messages, setMessages] = useState<ApiResult<ChatMessage[]>>()
  const takenByOther = question.status === "IN_PROGRESS" && question.assignedTo !== currentUserId
  const participant = question.status !== "NEW" && question.conversationId != null

  const loadMessages = useCallback(() => {
    if (!question.conversationId) return
    getChatMessages(question.conversationId).then(setMessages)
  }, [question.conversationId])

  useEffect(() => {
    if (participant) loadMessages()
  }, [participant, loadMessages])

  const writable = question.status === "IN_PROGRESS" && question.conversationId != null
  const [draft, setDraft] = useState("")
  const chat = useChatSocket({
    conversationId: question.conversationId,
    enabled: writable,
    // Edits and deletions keep the message id, so replace by id and append otherwise.
    onMessage: (message) =>
      setMessages((current) =>
        current?.ok
          ? {
              ok: true,
              data: current.data.some((item) => item.id === message.id)
                ? current.data.map((item) => (item.id === message.id ? message : item))
                : [...current.data, message],
            }
          : current
      ),
    onError: (message) => toast.add({ title: "Сообщение не отправлено", description: message, type: "error" }),
  })

  function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    if (chat.send(text)) setDraft("")
    else toast.add({ title: "Нет соединения с чатом", description: "Попробуйте ещё раз через несколько секунд", type: "error" })
  }

  function fail(title: string, error: ApiError) {
    if (error.code === "SUPPORT_QUESTION_CLOSED") {
      toast.add({ title: "Вопрос уже закрыт", type: "error" })
      router.refresh()
      return
    }
    toast.add({ title, description: error.message, type: "error" })
  }

  function run(action: typeof takeSupportQuestion, title: string, success: string) {
    startTransition(async () => {
      const result = await action(question.id)
      if (!result.ok) {
        fail(title, result.error)
        return
      }
      toast.add({ title: success, type: "success" })
      setQuestion(result.data)
      if (result.data.conversationId) getChatMessages(result.data.conversationId).then(setMessages)
    })
  }

  const take = () => run(takeSupportQuestion, "Не удалось взять вопрос", "Вопрос взят в работу")
  const close = () => run(closeSupportQuestion, "Не удалось закрыть вопрос", "Вопрос закрыт")

  return (
    <>
      <PageHeader
        title="Вопрос пользователя"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={question.status === "NEW" ? "default" : "outline"}>
              {SUPPORT_QUESTION_STATUS_LABELS[question.status] ?? question.status}
            </Badge>
            <span>Задан {formatDateTime(question.createdAt)}</span>
            {question.closedAt && <span>· закрыт {formatDateTime(question.closedAt)}</span>}
          </span>
        }
      >
        {question.status !== "CLOSED" && (
          <div className="flex flex-wrap gap-2">
            {question.status === "NEW" && (
              <Button onClick={take} disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : <HandIcon data-icon="inline-start" />}
                Взять в работу
              </Button>
            )}
            {takenByOther && (
              <Confirm
                trigger="Взять в работу"
                icon={<HandIcon data-icon="inline-start" />}
                title="Взять вопрос?"
                description="Вопрос уже ведёт другой администратор. В чате останетесь вы оба."
                pending={pending}
                onConfirm={take}
              />
            )}
            <Confirm
              trigger="Закрыть вопрос"
              icon={<LockIcon data-icon="inline-start" />}
              title="Закрыть вопрос?"
              description="Пользователь больше не сможет писать в этот чат. Переоткрыть вопрос нельзя."
              pending={pending}
              destructive
              onConfirm={close}
            />
          </div>
        )}
      </PageHeader>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{question.userDisplayName ?? "Без имени"}</CardTitle>
            <div className="text-sm text-muted-foreground">{question.userEmail}</div>
            {canReadUsers && (
              <Link
                href={`/admin/users/${question.userId}/cases`}
                className="w-fit text-sm underline-offset-4 hover:underline"
              >
                Карточка пользователя
              </Link>
            )}
          </CardHeader>
          <CardContent className="whitespace-pre-line break-words">{question.message}</CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Чат</CardTitle>
            {participant && (
              <Button variant="ghost" size="sm" onClick={loadMessages}>
                <RefreshCwIcon data-icon="inline-start" />
                Обновить
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!participant ? (
              <p className="text-sm text-muted-foreground">
                {question.conversationId == null && question.status === "CLOSED"
                  ? "Чат удалён (закрытые чаты хранятся 14 дней)"
                  : "История чата будет доступна после «Взять в работу»"}
              </p>
            ) : !messages ? (
              <Spinner />
            ) : !messages.ok ? (
              <p className="text-sm text-muted-foreground">
                {messages.error.code === "CONVERSATION_NOT_FOUND"
                  ? "Вы не участник этого чата: возьмите вопрос в работу, чтобы увидеть переписку"
                  : messages.error.message}
              </p>
            ) : (
              <ChatHistory messages={messages.data} authorId={question.userId} />
            )}
            {writable ? (
              <form onSubmit={sendMessage} className="flex flex-col gap-2">
                <Textarea
                  rows={3}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ответ пользователю"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {chat.status === "connected" ? "Подключено" : chat.status === "connecting" ? "Подключение…" : "Нет соединения"}
                  </span>
                  <Button type="submit" size="sm" disabled={chat.status !== "connected" || !draft.trim()}>
                    <SendIcon data-icon="inline-start" />
                    Отправить
                  </Button>
                </div>
              </form>
            ) : (
              question.status === "CLOSED" && (
                <p className="text-xs text-muted-foreground">Вопрос закрыт: чат только для чтения.</p>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function ChatHistory({ messages, authorId }: { messages: ChatMessage[]; authorId: string }) {
  if (messages.length === 0) return <p className="text-sm text-muted-foreground">Сообщений нет</p>
  const sorted = messages.toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))

  return (
    <ol className="flex max-h-[36rem] flex-col gap-3 overflow-y-auto rounded-lg border p-3">
      {sorted.map((message) => {
        const fromUser = message.senderId === authorId
        const removed = message.text == null || message.deletedAt != null
        return (
          <li
            key={message.id}
            className={cn("flex max-w-[80%] flex-col gap-1", fromUser ? "items-start self-start" : "items-end self-end")}
          >
            <span className="text-xs text-muted-foreground">
              {fromUser ? "Пользователь" : "Администратор"} · {formatDateTime(message.createdAt)}
              {message.editedAt && " · изменено"}
            </span>
            <div
              className={cn(
                "rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-line",
                removed ? "bg-muted text-muted-foreground italic" : fromUser ? "bg-muted" : "bg-primary text-primary-foreground"
              )}
            >
              {removed ? "Сообщение удалено" : message.text}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function Confirm({
  trigger,
  icon,
  title,
  description,
  pending,
  destructive,
  onConfirm,
}: {
  trigger: string
  icon: React.ReactNode
  title: string
  description: string
  pending: boolean
  destructive?: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant={destructive ? "destructive" : "default"} disabled={pending} />}>
        {pending ? <Spinner data-icon="inline-start" /> : icon}
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? "destructive" : "default"} onClick={onConfirm}>
            {trigger}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
