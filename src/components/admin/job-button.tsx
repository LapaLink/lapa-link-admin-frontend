"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { PlayIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { runJob } from "@/lib/admin/actions"
import { ADMIN_JOB_INFO } from "@/lib/admin/labels"
import type { AdminJob } from "@/lib/api/admin-types"

export function JobButton({ job, label = "Запустить" }: { job: AdminJob; label?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function run() {
    startTransition(async () => {
      const result = await runJob(job)
      if (!result.ok) {
        toast.add({ title: "Задача завершилась с ошибкой", description: result.error.message, type: "error" })
        return
      }
      toast.add({ title: `«${ADMIN_JOB_INFO[job].title}» выполнена`, type: "success" })
      router.refresh()
    })
  }

  return (
    <Button variant="outline" onClick={run} disabled={pending}>
      {pending ? <Spinner data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
      {label}
    </Button>
  )
}
