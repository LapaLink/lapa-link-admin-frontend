"use client"

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react"
import { CircleAlertIcon, KeyRoundIcon, RefreshCwIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { getPhoneConfirmationCode } from "@/lib/admin/actions"
import type { PhoneConfirmationCode } from "@/lib/api/admin-types"
import type { ApiError } from "@/lib/api/types"

// OTP_VIEW_DISABLED means code viewing is off in this environment: the button stays hidden until the session ends.
const DISABLED_KEY = "otp-view-disabled"
const listeners = new Set<() => void>()

function readDisabled() {
  try {
    return sessionStorage.getItem(DISABLED_KEY) === "1"
  } catch {
    return false
  }
}

function markDisabled() {
  try {
    sessionStorage.setItem(DISABLED_KEY, "1")
  } catch {}
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

type Shown = { code: PhoneConfirmationCode; expiresAt: number }

/**
 * Shows the active phone confirmation code for environments without an SMS gateway. The code lives only in this
 * component's state while the dialog is open: it is dropped on close and never logged.
 */
export function PhoneCodeButton({ userId }: { userId: string }) {
  const hidden = useSyncExternalStore(subscribe, readDisabled, () => false)
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState<Shown>()
  const [error, setError] = useState<ApiError>()
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [pending, startTransition] = useTransition()
  const disableOnClose = useRef(false)

  function load() {
    startTransition(async () => {
      const result = await getPhoneConfirmationCode(userId)
      if (!result.ok) {
        setShown(undefined)
        setError(result.error)
        if (result.error.code === "OTP_VIEW_DISABLED") disableOnClose.current = true
        return
      }
      setError(undefined)
      setShown({ code: result.data, expiresAt: Date.now() + result.data.expiresInSeconds * 1000 })
      setSecondsLeft(result.data.expiresInSeconds)
    })
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      disableOnClose.current = false
      load()
      return
    }
    setShown(undefined)
    setError(undefined)
    if (disableOnClose.current) markDisabled()
  }

  const expiresAt = shown?.expiresAt
  useEffect(() => {
    if (!expiresAt) return
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [expiresAt])

  if (hidden && !open) return null

  const expired = shown !== undefined && secondsLeft <= 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <KeyRoundIcon data-icon="inline-start" />
        Показать код подтверждения
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Код подтверждения телефона</DialogTitle>
          <DialogDescription>
            Просмотр записывается в журнал аудита. Номер подтверждает сам пользователь, введя этот код.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        {!error && !shown && <Spinner />}
        {shown && (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="text-sm text-muted-foreground">{shown.code.phone}</div>
            {expired ? (
              <>
                <div className="text-lg font-medium text-muted-foreground">Код истёк</div>
                <Button variant="outline" size="sm" onClick={load} disabled={pending}>
                  {pending ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
                  Обновить
                </Button>
              </>
            ) : (
              <>
                <div className="font-mono text-4xl tracking-widest tabular-nums">{shown.code.code}</div>
                <div className="text-sm text-muted-foreground tabular-nums">Действует ещё {secondsLeft} с</div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
