"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { PencilIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { deleteBadge, setBadgeActivity } from "@/lib/admin/badges/actions"
import {
  ACTIVE_BADGE,
  AWARDED_BADGE,
  HIDDEN_BADGE,
  badgePath,
  type AdminBadge
} from "@/lib/admin/badges/model"
import type { ApiError } from "@/lib/api/types"

type Operation = "enable" | "disable" | "delete"

const operationLabels = {
  enable: "Включить",
  disable: "Выключить",
  delete: "Удалить"
} as const

export function BadgeRowActions({ badge }: { badge: AdminBadge }) {
  const router = useRouter()
  const [operation, setOperation] = useState<Operation | null>(null)
  const [error, setError] = useState<ApiError>()
  const [pending, startTransition] = useTransition()
  const awarded = badge.awardedCount > 0

  function ask(next: Operation) {
    setError(undefined)
    setOperation(next)
  }

  function confirm() {
    if (!operation || pending) return
    startTransition(async () => {
      const result =
        operation === "delete"
          ? await deleteBadge(badge.code)
          : await setBadgeActivity(badge.code, operation === "enable")
      if (!result.ok) {
        if (result.error.code === "BADGE_ALREADY_AWARDED" || result.error.code === "BADGE_NOT_FOUND") {
          const alreadyAwarded = result.error.code === "BADGE_ALREADY_AWARDED"
          toast.add({
            title: alreadyAwarded ? "Значок уже получен" : "Значок не найден",
            description: alreadyAwarded ? AWARDED_BADGE : result.error.message,
            type: "error"
          })
          setOperation(null)
          router.refresh()
        } else setError(result.error)
        return
      }
      setOperation(null)
      toast.add({
        title:
          operation === "delete"
            ? "Значок удалён"
            : operation === "enable"
              ? "Значок включён"
              : "Значок выключен",
        type: "success"
      })
      router.refresh()
    })
  }

  return (
    <div className="flex min-w-44 flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <Switch
          checked={badge.active}
          disabled={pending}
          onCheckedChange={(active) => ask(active ? "enable" : "disable")}
          aria-label={`Активность: ${badge.nameRu}`}
        />
        <span className="text-xs">{badge.active ? "Включён" : "Выключен"}</span>
      </div>
      <div className="flex items-center gap-1">
        <Link className={buttonVariants({ variant: "ghost", size: "sm" })} href={badgePath(badge.code)}>
          <PencilIcon data-icon="inline-start" />
          Изменить
        </Link>
        {(!awarded || badge.active) && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => ask(awarded ? "disable" : "delete")}
          >
            {awarded ? "Выключить" : "Удалить"}
          </Button>
        )}
      </div>
      {awarded && (
        <p className="max-w-52 text-right text-xs whitespace-normal text-muted-foreground">{AWARDED_BADGE}</p>
      )}
      <AlertDialog open={!!operation} onOpenChange={(open) => !open && !pending && setOperation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{operation ? operationLabels[operation] : ""} значок?</AlertDialogTitle>
            <AlertDialogDescription>
              {operation === "delete"
                ? "Значок будет удалён из каталога без возможности восстановления."
                : operation === "enable"
                  ? `${HIDDEN_BADGE} ${ACTIVE_BADGE}`
                  : HIDDEN_BADGE}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error.status === 403 ? "Недостаточно прав" : error.message}
              </AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant={operation === "delete" ? "destructive" : "default"}
              disabled={pending}
              onClick={confirm}
            >
              {pending && <Spinner data-icon="inline-start" />}
              {operation ? operationLabels[operation] : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
