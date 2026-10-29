import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"

import { ApiErrorAlert } from "@/components/admin/api-error-alert"
import { ComplaintCard } from "@/components/admin/complaint-card"
import { ComplaintTargetView } from "@/components/admin/complaint-target"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { adminGet } from "@/lib/admin/api"
import type { AdminComplaint, ComplaintTarget } from "@/lib/api/admin-types"
import { getCurrentUser } from "@/lib/auth/current-user"
import { getPrivileges } from "@/lib/auth/privileges"

export const metadata: Metadata = { title: "Жалоба" }

export default function ComplaintPage({ params }: PageProps<"/admin/complaints/[complaintId]">) {
  return (
    <>
      <div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/complaints" />}>
          <ArrowLeftIcon data-icon="inline-start" />
          Очередь жалоб
        </Button>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Complaint params={params} />
      </Suspense>
    </>
  )
}

async function Complaint({ params }: { params: Promise<{ complaintId: string }> }) {
  const { complaintId } = await params
  const path = `/admin/complaints/${encodeURIComponent(complaintId)}`
  // The target is requested once per page render: every request is written to the audit log.
  const [complaint, target, user] = await Promise.all([
    adminGet<AdminComplaint>(path),
    adminGet<ComplaintTarget>(`${path}/target`),
    getCurrentUser(),
  ])
  if (!complaint.ok) return <ApiErrorAlert error={complaint.error} />

  return (
    <ComplaintCard initial={complaint.data} targetMissing={!target.ok && target.error.status === 404}>
      {target.ok ? (
        <ComplaintTargetView target={target.data} complaint={complaint.data} privileges={getPrivileges(user)} />
      ) : (
        <ApiErrorAlert error={target.error} />
      )}
    </ComplaintCard>
  )
}
