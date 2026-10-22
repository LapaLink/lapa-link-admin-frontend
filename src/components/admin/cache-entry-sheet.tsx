"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CircleAlertIcon, EyeOffIcon, Trash2Icon } from "lucide-react"

import { JsonView } from "@/components/admin/json-view"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { evictCacheEntry, getCacheEntry } from "@/lib/admin/actions"
import type { CacheEntry, CacheType } from "@/lib/api/admin-types"
import type { ApiError } from "@/lib/api/types"

type Props = { type: CacheType; cacheKey: string }

export function CacheEntrySheet({ type, cacheKey }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [entry, setEntry] = useState<CacheEntry>()
  const [error, setError] = useState<ApiError>()
  const [loading, startLoading] = useTransition()
  const [evicting, startEvicting] = useTransition()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) return
    setEntry(undefined)
    setError(undefined)
    startLoading(async () => {
      const result = await getCacheEntry(type, cacheKey)
      if (result.ok) setEntry(result.data)
      else setError(result.error)
    })
  }

  function evict() {
    startEvicting(async () => {
      const result = await evictCacheEntry(type, cacheKey)
      if (!result.ok && result.error.code !== "CACHE_ENTRY_NOT_FOUND") {
        toast.add({ title: "Не удалось очистить запись", description: result.error.message, type: "error" })
        return
      }
      setOpen(false)
      toast.add({ title: "Запись удалена из кэша", type: "success" })
      router.refresh()
    })
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button variant="ghost" size="sm" />}>Открыть</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{type}</SheetTitle>
          <SheetDescription className="font-mono break-all">{cacheKey}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          {loading && <Skeleton className="h-40" />}
          {error && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          {entry && (
            <>
              <p className="text-sm text-muted-foreground">
                Время жизни:{" "}
                {entry.ttlSeconds === null ? "без срока" : `${entry.ttlSeconds} с`}
              </p>
              {entry.masked ? (
                <Alert>
                  <EyeOffIcon />
                  <AlertDescription>Значение скрыто: запись содержит секреты.</AlertDescription>
                </Alert>
              ) : (
                <JsonView value={entry.value} />
              )}
            </>
          )}
        </div>
        <SheetFooter>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="destructive" disabled={evicting || Boolean(error)} />}
            >
              <Trash2Icon data-icon="inline-start" />
              Очистить запись
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Очистить запись кэша?</AlertDialogTitle>
                <AlertDialogDescription>
                  Запись {type} будет удалена. При следующем обращении значение загрузится заново;
                  удаление сессии или токена завершит вход пользователя.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={evict}>
                  Очистить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
