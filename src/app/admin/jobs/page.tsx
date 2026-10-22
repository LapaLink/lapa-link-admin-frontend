import type { Metadata } from "next"

import { JobButton } from "@/components/admin/job-button"
import { PageHeader } from "@/components/admin/page-header"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ADMIN_JOB_INFO } from "@/lib/admin/labels"
import { ADMIN_JOBS } from "@/lib/api/admin-types"

export const metadata: Metadata = { title: "Фоновые задачи" }

export default function JobsPage() {
  return (
    <>
      <PageHeader
        title="Фоновые задачи"
        description="Запуск задач планировщика вне расписания. Задача выполняется синхронно"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ADMIN_JOBS.map((job) => (
          <Card key={job}>
            <CardHeader>
              <CardTitle>{ADMIN_JOB_INFO[job].title}</CardTitle>
              <CardDescription>{ADMIN_JOB_INFO[job].description}</CardDescription>
            </CardHeader>
            <CardFooter className="justify-between gap-2">
              <code className="font-mono text-xs text-muted-foreground">{job}</code>
              <JobButton job={job} />
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  )
}
