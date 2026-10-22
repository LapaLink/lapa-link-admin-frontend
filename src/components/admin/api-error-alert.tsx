import { CircleAlertIcon, LockIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ApiError } from "@/lib/api/types"

export function ApiErrorAlert({ error }: { error: ApiError }) {
  const forbidden = error.status === 403

  return (
    <Alert variant={forbidden ? "default" : "destructive"}>
      {forbidden ? <LockIcon /> : <CircleAlertIcon />}
      <AlertTitle>{forbidden ? "Недостаточно прав" : "Не удалось загрузить данные"}</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  )
}
