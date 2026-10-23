"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ShieldMinusIcon, ShieldPlusIcon } from "lucide-react"

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
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { grantModerator, revokeModerator } from "@/lib/admin/actions"
import type { AdminUser } from "@/lib/api/admin-types"

export function ModeratorRoleButton({ user }: { user: AdminUser }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const moderator = user.roles.includes("MODERATOR")
  const name = user.displayName ?? user.email

  if (user.roles.includes("ADMIN") || (!moderator && user.status !== "ACTIVE")) return null

  function submit() {
    startTransition(async () => {
      const result = moderator ? await revokeModerator(user.id) : await grantModerator(user.id)
      if (!result.ok) {
        toast.add({ title: "Не удалось изменить роль", description: result.error.message, type: "error" })
        return
      }
      toast.add({ title: moderator ? "Роль модератора снята" : "Роль модератора выдана", type: "success" })
      router.refresh()
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" disabled={pending} />}>
        {pending ? (
          <Spinner data-icon="inline-start" />
        ) : moderator ? (
          <ShieldMinusIcon data-icon="inline-start" />
        ) : (
          <ShieldPlusIcon data-icon="inline-start" />
        )}
        {moderator ? "Снять модератора" : "Сделать модератором"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{moderator ? "Снять роль модератора?" : "Выдать роль модератора?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {moderator
              ? `${name} потеряет доступ к модерации объявлений сразу, без повторного входа.`
              : `${name} получит доступ к модерации объявлений. Текущая сессия пользователя завершится: при следующем входе потребуется настроить или ввести код MFA.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction variant={moderator ? "destructive" : "default"} onClick={submit}>
            {moderator ? "Снять роль" : "Выдать роль"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
