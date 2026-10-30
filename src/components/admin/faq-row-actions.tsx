"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2Icon } from "lucide-react"

import { FaqDialog } from "@/components/admin/faq-dialog"
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
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { deleteFaq, updateFaq } from "@/lib/admin/actions"
import type { Faq } from "@/lib/api/admin-types"
import type { ApiError } from "@/lib/api/types"

/** Publication switch, editing and deletion of one FAQ entry. */
export function FaqRowActions({ faq }: { faq: Faq }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function fail(title: string, error: ApiError) {
    toast.add({ title, description: error.message, type: "error" })
    if (error.code === "FAQ_NOT_FOUND") router.refresh()
  }

  function togglePublished(published: boolean) {
    startTransition(async () => {
      const { questionRu, answerRu, questionBe, answerBe, sortOrder } = faq
      const result = await updateFaq(faq.id, { questionRu, answerRu, questionBe, answerBe, sortOrder, published })
      if (!result.ok) {
        fail("Не удалось изменить публикацию", result.error)
        return
      }
      toast.add({ title: published ? "Вопрос опубликован" : "Публикация снята", type: "success" })
      router.refresh()
    })
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteFaq(faq.id)
      if (!result.ok) {
        fail("Не удалось удалить вопрос", result.error)
        return
      }
      toast.add({ title: "Вопрос удалён", type: "success" })
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Switch
        checked={faq.published}
        onCheckedChange={togglePublished}
        disabled={pending}
        aria-label="Опубликован"
      />
      <FaqDialog faq={faq} />
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="ghost" size="sm" disabled={pending} />}>
          {pending ? <Spinner data-icon="inline-start" /> : <Trash2Icon data-icon="inline-start" />}
          Удалить
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить вопрос?</AlertDialogTitle>
            <AlertDialogDescription>
              Вопрос будет удалён безвозвратно. Чтобы временно убрать его с сайта, снимите публикацию.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
