"use client"

import { useState } from "react"

import { CredentialsStep } from "@/components/auth/credentials-step"
import { MfaStep } from "@/components/auth/mfa-step"
import { RecoveryCodesStep } from "@/components/auth/recovery-codes-step"
import type { ApiError, MfaSetupResponse } from "@/lib/api/types"

type Step =
  | { name: "credentials"; error?: ApiError }
  | { name: "mfa"; mfaToken: string; setup: MfaSetupResponse | null; expiresAt: number }
  | { name: "recovery-codes"; recoveryCodes: string[] }

export function LoginFlow({ notice }: { notice?: string }) {
  const [step, setStep] = useState<Step>({ name: "credentials" })

  if (step.name === "mfa") {
    return (
      <MfaStep
        key={step.mfaToken}
        mfaToken={step.mfaToken}
        setup={step.setup}
        expiresAt={step.expiresAt}
        onRestart={(error) => setStep({ name: "credentials", error })}
        onRecoveryCodes={(recoveryCodes) => setStep({ name: "recovery-codes", recoveryCodes })}
      />
    )
  }

  if (step.name === "recovery-codes") {
    return <RecoveryCodesStep recoveryCodes={step.recoveryCodes} />
  }

  return (
    <CredentialsStep
      notice={step.error ? undefined : notice}
      initialError={step.error}
      onMfa={(challenge) => setStep({ name: "mfa", ...challenge })}
    />
  )
}
