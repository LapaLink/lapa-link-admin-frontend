"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CircleAlertIcon, SendIcon, XIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { createBroadcast, searchUsers } from "@/lib/admin/actions"
import { BROADCAST_AUDIENCE_LABELS, BROADCAST_CHANNEL_LABELS } from "@/lib/admin/labels"
import type { AdminUser, BroadcastAudience, BroadcastChannel } from "@/lib/api/admin-types"
import type { ApiError } from "@/lib/api/types"

const TITLE_MAX = 150
const MESSAGE_MAX = 2000
const USERS_MAX = 1000
const SMS_SEGMENT = 70
const FORBIDDEN_HINT = "Перелогиньтесь, чтобы обновить права"

type Recipient = { id: string; label: string }

export function BroadcastForm({ canSearchUsers }: { canSearchUsers: boolean }) {
  const router = useRouter()
  const [channel, setChannel] = useState<BroadcastChannel>("EMAIL")
  const [audience, setAudience] = useState<BroadcastAudience>("ALL")
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<ApiError>()
  const [pending, startTransition] = useTransition()
  const needsUsers = audience !== "ALL"
  const limit = audience === "USER" ? 1 : USERS_MAX
  const ready = title.trim() && message.trim() && (!needsUsers || recipients.length > 0)

  function changeAudience(next: BroadcastAudience) {
    setAudience(next)
    if (next === "USER") setRecipients((current) => current.slice(0, 1))
  }

  function addRecipient(recipient: Recipient) {
    setRecipients((current) => {
      if (current.some((item) => item.id === recipient.id)) return current
      return audience === "USER" ? [recipient] : [...current, recipient].slice(0, limit)
    })
  }

  function send() {
    setConfirming(false)
    setError(undefined)
    startTransition(async () => {
      const result = await createBroadcast({
        channel,
        audience,
        userIds: needsUsers ? recipients.map((item) => item.id) : undefined,
        title: title.trim(),
        message: message.trim(),
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/admin/broadcasts/${result.data.id}`)
    })
  }

  const fieldError = (name: string) => error?.fields?.[name]
  const generalError = error && !error.fields

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (ready) setConfirming(true)
      }}
      className="flex max-w-2xl flex-col gap-6"
    >
      <FieldGroup>
        {generalError && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>
              {error.code === "BROADCAST_NO_RECIPIENTS" ? "Нет ни одного активного получателя" : error.message}
              {error.status === 403 && <div className="mt-1">{FORBIDDEN_HINT}</div>}
            </AlertDescription>
          </Alert>
        )}
        <Field>
          <FieldLabel>Канал</FieldLabel>
          <ToggleGroup
            value={[channel]}
            onValueChange={(value) => value[0] && setChannel(value[0] as BroadcastChannel)}
            variant="outline"
            className="flex-wrap"
          >
            {Object.entries(BROADCAST_CHANNEL_LABELS).map(([value, label]) => (
              <ToggleGroupItem key={value} value={value}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
        <Field data-invalid={Boolean(fieldError("audience"))}>
          <FieldLabel htmlFor="audience">Аудитория</FieldLabel>
          <NativeSelect
            id="audience"
            value={audience}
            onChange={(event) => changeAudience(event.target.value as BroadcastAudience)}
          >
            {Object.entries(BROADCAST_AUDIENCE_LABELS).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError>{fieldError("audience")}</FieldError>
        </Field>
        {needsUsers && (
          <RecipientPicker
            canSearch={canSearchUsers}
            recipients={recipients}
            limit={limit}
            error={fieldError("userIds")}
            onAdd={addRecipient}
            onRemove={(id) => setRecipients((current) => current.filter((item) => item.id !== id))}
          />
        )}
        <Field data-invalid={Boolean(fieldError("title"))}>
          <FieldLabel htmlFor="title">Заголовок</FieldLabel>
          <Input
            id="title"
            required
            maxLength={TITLE_MAX}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={Boolean(fieldError("title"))}
          />
          <FieldDescription className="tabular-nums">
            {channel === "SMS" && "В SMS не отправляется, нужен для истории. "}
            {title.length}/{TITLE_MAX}
          </FieldDescription>
          <FieldError>{fieldError("title")}</FieldError>
        </Field>
        <Field data-invalid={Boolean(fieldError("message"))}>
          <FieldLabel htmlFor="message">Текст</FieldLabel>
          <Textarea
            id="message"
            required
            rows={6}
            maxLength={MESSAGE_MAX}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            aria-invalid={Boolean(fieldError("message"))}
          />
          <FieldDescription className="tabular-nums">
            {message.length}/{MESSAGE_MAX}
            {channel === "SMS" &&
              ` · одно SMS вмещает около ${SMS_SEGMENT} символов кириллицы, длинный текст уйдёт несколькими SMS (сейчас около ${Math.max(1, Math.ceil(message.length / SMS_SEGMENT))})`}
          </FieldDescription>
          <FieldError>{fieldError("message")}</FieldError>
        </Field>
      </FieldGroup>
      <div>
        <Button type="submit" disabled={pending || !ready}>
          {pending ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
          Отправить
        </Button>
      </div>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отправить рассылку?</AlertDialogTitle>
            <AlertDialogDescription render={<div />} className="flex flex-col gap-2">
              <span>
                {BROADCAST_CHANNEL_LABELS[channel]} · {BROADCAST_AUDIENCE_LABELS[audience]}
                {needsUsers && ` (${recipients.length})`}
              </span>
              <span className="font-medium text-foreground">{title.trim()}</span>
              <span className="max-h-40 overflow-y-auto whitespace-pre-line break-words">{message.trim()}</span>
              {audience === "ALL" && (
                <span className="font-medium text-destructive">
                  Рассылка уйдёт всем активным пользователям, её нельзя отозвать.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction variant={audience === "ALL" ? "destructive" : "default"} onClick={send}>
              Отправить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function RecipientPicker({
  canSearch,
  recipients,
  limit,
  error,
  onAdd,
  onRemove,
}: {
  canSearch: boolean
  recipients: Recipient[]
  limit: number
  error?: string
  onAdd: (recipient: Recipient) => void
  onRemove: (id: string) => void
}) {
  const [query, setQuery] = useState("")
  const [found, setFound] = useState<AdminUser[]>()
  const [searchError, setSearchError] = useState<string>()
  const [searching, startSearch] = useTransition()

  function search() {
    const text = query.trim()
    if (!text) return
    setSearchError(undefined)
    startSearch(async () => {
      const result = await searchUsers(text)
      if (!result.ok) {
        setFound(undefined)
        setSearchError(result.error.message)
        return
      }
      setFound(result.data.content)
    })
  }

  function addById() {
    const id = query.trim()
    if (!UUID.test(id)) {
      setSearchError("Введите идентификатор пользователя (UUID)")
      return
    }
    setSearchError(undefined)
    onAdd({ id, label: id })
    setQuery("")
  }

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="recipient">Получатели ({recipients.length}/{limit})</FieldLabel>
      <div className="flex gap-2">
        <Input
          id="recipient"
          value={query}
          placeholder={canSearch ? "Имя или email" : "Идентификатор пользователя"}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return
            event.preventDefault()
            if (canSearch) search()
            else addById()
          }}
        />
        <Button type="button" variant="outline" onClick={canSearch ? search : addById} disabled={searching}>
          {searching && <Spinner data-icon="inline-start" />}
          {canSearch ? "Найти" : "Добавить"}
        </Button>
      </div>
      {searchError && <FieldError>{searchError}</FieldError>}
      {found && (
        <ul className="flex max-h-48 flex-col overflow-y-auto rounded-lg border">
          {found.length === 0 && <li className="p-2 text-sm text-muted-foreground">Никого не найдено</li>}
          {found.map((user) => (
            <li key={user.id} className="flex items-center justify-between gap-2 border-b p-2 text-sm last:border-b-0">
              <span className="min-w-0 truncate">
                {user.displayName ?? "Без имени"}{" "}
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={recipients.length >= limit && limit > 1}
                onClick={() => onAdd({ id: user.id, label: user.displayName ?? user.email })}
              >
                Добавить
              </Button>
            </li>
          ))}
        </ul>
      )}
      {recipients.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recipients.map((recipient) => (
            <Badge key={recipient.id} variant="secondary" className="gap-1">
              {recipient.label}
              <button type="button" aria-label="Убрать" onClick={() => onRemove(recipient.id)}>
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <FieldError>{error}</FieldError>
    </Field>
  )
}
