"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Reloads the data above a table. Without `onRefresh` it re-renders the current route on the server;
 * client-fetched tables pass their own loader.
 */
export function RefreshButton({ onRefresh }: { onRefresh?: () => Promise<unknown> | void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function refresh() {
    startTransition(async () => {
      if (onRefresh) await onRefresh()
      else router.refresh()
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={refresh}
      disabled={pending}
      aria-label="Обновить данные"
      title="Обновить данные"
    >
      <RefreshCwIcon className={cn(pending && "animate-spin")} />
    </Button>
  )
}
