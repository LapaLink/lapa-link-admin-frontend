"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import debounce from "lodash.debounce"
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
import { cn } from "@/lib/utils"

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
const SEARCH_DELAY_MS = 300
const SEARCH_MIN_LENGTH = 2

/**
 * Recipient picker. With USER_READ it is a search field with a dropdown (debounced requests, keyboard
 * navigation); without it, a plain input for a user id.
 */
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
  const [results, setResults] = useState<AdminUser[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string>()
  const container = useRef<HTMLDivElement>(null)
  const selected = new Set(recipients.map((item) => item.id))
  const searched = query.trim().length >= SEARCH_MIN_LENGTH

  // Debounced search; `invalidate` drops the answer of any request already in flight.
  const search = useMemo(() => {
    let latest = 0
    const run = debounce(async (text: string) => {
      const request = ++latest
      const result = await searchUsers(text)
      if (request !== latest) return
      setSearching(false)
      if (!result.ok) {
        setResults([])
        setSearchError(result.error.message)
        return
      }
      setSearchError(undefined)
      setResults(result.data.content)
      setActive(0)
    }, SEARCH_DELAY_MS)
    return {
      run,
      invalidate: () => {
        run.cancel()
        latest++
      },
    }
  }, [])

  useEffect(() => search.invalidate, [search])

  useEffect(() => {
    function closeOutside(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", closeOutside)
    return () => document.removeEventListener("mousedown", closeOutside)
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    setSearchError(undefined)
    if (!canSearch) return
    setOpen(true)
    if (value.trim().length < SEARCH_MIN_LENGTH) {
      search.invalidate()
      setSearching(false)
      setResults([])
      return
    }
    setSearching(true)
    search.run(value.trim())
  }

  function select(user: AdminUser) {
    if (selected.has(user.id)) return
    onAdd({ id: user.id, label: user.displayName ?? user.email })
    if (limit === 1) {
      setQuery("")
      setResults([])
      setOpen(false)
    }
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

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!canSearch) {
      if (event.key === "Enter") {
        event.preventDefault()
        addById()
      }
      return
    }
    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault()
      setOpen(true)
      setActive((current) => (current + 1) % results.length)
    } else if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault()
      setActive((current) => (current - 1 + results.length) % results.length)
    } else if (event.key === "Enter" && open && results[active]) {
      event.preventDefault()
      select(results[active])
    } else if (event.key === "Escape") {
      setOpen(false)
    }
  }

  const showList = canSearch && open && searched && !searching
  const listId = "recipient-list"

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="recipient">
        Получатели ({recipients.length}/{limit})
      </FieldLabel>
      <div ref={container} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="recipient"
              value={query}
              autoComplete="off"
              placeholder={canSearch ? "Имя или email" : "Идентификатор пользователя"}
              role={canSearch ? "combobox" : undefined}
              aria-expanded={canSearch ? showList : undefined}
              aria-controls={canSearch ? listId : undefined}
              aria-activedescendant={showList && results[active] ? `recipient-${results[active].id}` : undefined}
              onChange={(event) => handleChange(event.target.value)}
              onFocus={() => canSearch && setOpen(true)}
              onKeyDown={handleKeyDown}
            />
            {searching && <Spinner className="absolute top-1/2 right-3 -translate-y-1/2" />}
          </div>
          {!canSearch && (
            <Button type="button" variant="outline" onClick={addById}>
              Добавить
            </Button>
          )}
        </div>
        {showList && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-md"
          >
            {results.length === 0 && !searchError && (
              <li className="p-3 text-sm text-muted-foreground">Никого не найдено</li>
            )}
            {results.map((user, index) => {
              const added = selected.has(user.id)
              return (
                <li
                  key={user.id}
                  id={`recipient-${user.id}`}
                  role="option"
                  aria-selected={added}
                  aria-disabled={added}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm",
                    index === active && "bg-accent text-accent-foreground",
                    added && "cursor-default opacity-50"
                  )}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    select(user)
                  }}
                >
                  <span className="min-w-0 truncate">
                    {user.displayName ?? "Без имени"}
                    <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                  </span>
                  {added && <span className="shrink-0 text-xs">Добавлен</span>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {searchError && <FieldError>{searchError}</FieldError>}
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
