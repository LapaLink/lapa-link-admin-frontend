"use client"

import { useState, useTransition } from "react"
import { CircleAlertIcon, InfoIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { login } from "@/lib/auth/actions"
import type { ApiError, MfaSetupResponse } from "@/lib/api/types"

type Challenge = { mfaToken: string; setup: MfaSetupResponse | null; expiresAt: number }

type Props = {
  notice?: string
  initialError?: ApiError
  onMfa: (challenge: Challenge) => void
}

export function CredentialsStep({ notice, initialError, onMfa }: Props) {
  const [error, setError] = useState(initialError)
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await login(String(form.get("email")), String(form.get("password")))
      if (result.status === "error") {
        setError(result.error)
        return
      }
      onMfa(result)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Вход в панель администратора</CardTitle>
        <CardDescription>Для администраторов и модераторов ЛапаРядом</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error ? (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : notice ? (
              <Alert>
                <InfoIcon />
                <AlertDescription>{notice}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Пароль</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
            <Field>
              <Button type="submit" disabled={pending}>
                {pending && <Spinner data-icon="inline-start" />}
                Продолжить
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
