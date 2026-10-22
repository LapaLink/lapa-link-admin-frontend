"use client"

import { useState, useTransition } from "react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { QRCodeSVG } from "qrcode.react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { verifyMfa } from "@/lib/auth/actions"
import type { ApiError, MfaSetupResponse } from "@/lib/api/types"

const RESTART_CODES = ["MFA_TOKEN_INVALID", "MFA_ATTEMPTS_EXCEEDED"]

const CHALLENGE_EXPIRED: ApiError = {
  status: 401,
  code: "MFA_TOKEN_INVALID",
  message: "Время на ввод кода истекло. Войдите заново.",
}

type Props = {
  mfaToken: string
  setup: MfaSetupResponse | null
  expiresAt: number
  onRestart: (error?: ApiError) => void
  onRecoveryCodes: (codes: string[]) => void
}

export function MfaStep({ mfaToken, setup, expiresAt, onRestart, onRecoveryCodes }: Props) {
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  function submit(value: string) {
    if (Date.now() >= expiresAt) {
      onRestart(CHALLENGE_EXPIRED)
      return
    }
    startTransition(async () => {
      const result = await verifyMfa(mfaToken, value)
      if (!result) return
      if (result.status === "recovery-codes") {
        onRecoveryCodes(result.recoveryCodes)
        return
      }
      if (result.error.code && RESTART_CODES.includes(result.error.code)) {
        onRestart(result.error)
        return
      }
      setError(result.error.message)
      setCode("")
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit(code.trim())
  }

  function toggleMode() {
    setUseRecoveryCode((current) => !current)
    setCode("")
    setError(undefined)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {setup ? "Настройка двухфакторной аутентификации" : "Подтверждение входа"}
        </CardTitle>
        <CardDescription>
          {setup
            ? "Отсканируйте QR-код в приложении-аутентификаторе (Google Authenticator, Яндекс Ключ и т. п.) и введите шестизначный код."
            : "Введите шестизначный код из приложения-аутентификатора."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {setup && (
              <Field>
                <div className="flex justify-center">
                  <QRCodeSVG value={setup.otpauthUri} size={176} marginSize={2} />
                </div>
                <FieldDescription>
                  Не получается отсканировать? Введите ключ вручную:
                </FieldDescription>
                <code className="rounded-md bg-muted px-2 py-1.5 text-center font-mono text-sm break-all select-all">
                  {setup.secret}
                </code>
              </Field>
            )}
            {useRecoveryCode ? (
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="recovery-code">Код восстановления</FieldLabel>
                <Input
                  id="recovery-code"
                  placeholder="xxxx-xxxx"
                  autoComplete="off"
                  autoFocus
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  aria-invalid={Boolean(error)}
                  disabled={pending}
                />
                <FieldError>{error}</FieldError>
              </Field>
            ) : (
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="totp-code">Код из приложения</FieldLabel>
                <InputOTP
                  id="totp-code"
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  autoFocus
                  value={code}
                  onChange={setCode}
                  onComplete={submit}
                  disabled={pending}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot key={index} index={index} aria-invalid={Boolean(error)} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <FieldError>{error}</FieldError>
              </Field>
            )}
            <Field>
              <Button type="submit" disabled={pending || code.trim().length === 0}>
                {pending && <Spinner data-icon="inline-start" />}
                Подтвердить
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => onRestart()} disabled={pending}>
          Назад
        </Button>
        {!setup && (
          <Button variant="link" size="sm" onClick={toggleMode} disabled={pending}>
            {useRecoveryCode ? "Ввести код из приложения" : "Использовать код восстановления"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
