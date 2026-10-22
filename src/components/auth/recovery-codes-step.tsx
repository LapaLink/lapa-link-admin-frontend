"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, CopyIcon, TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function RecoveryCodesStep({ recoveryCodes }: { recoveryCodes: string[] }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(recoveryCodes.join("\n"))
    setCopied(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Коды восстановления</CardTitle>
        <CardDescription>
          Двухфакторная аутентификация включена. Каждый код можно использовать один раз вместо кода
          из приложения, если доступ к телефону потерян.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Коды показываются только один раз</AlertTitle>
          <AlertDescription>
            Сохраните их в надёжном месте. Без кодов восстановление доступа возможно только через
            администратора базы данных.
          </AlertDescription>
        </Alert>
        <ul className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-3 font-mono text-sm">
          {recoveryCodes.map((code) => (
            <li key={code} className="text-center">
              {code}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <Button variant="outline" onClick={copy}>
          {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          {copied ? "Скопировано" : "Скопировать"}
        </Button>
        <Button onClick={() => router.replace("/admin")}>Я сохранил коды</Button>
      </CardFooter>
    </Card>
  )
}
