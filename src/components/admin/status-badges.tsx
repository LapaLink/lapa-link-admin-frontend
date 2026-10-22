import { Badge } from "@/components/ui/badge"
import {
  CASE_STATUS_LABELS,
  HELP_APPLICATION_STATUS_LABELS,
  USER_STATUS_LABELS,
} from "@/lib/admin/labels"
import type { CaseStatus, HelpApplicationStatus } from "@/lib/api/admin-types"
import type { UserStatus } from "@/lib/api/types"

type Variant = React.ComponentProps<typeof Badge>["variant"]

const USER_STATUS_VARIANTS: Record<UserStatus, Variant> = {
  PENDING_VERIFICATION: "outline",
  ACTIVE: "secondary",
  SUSPENDED: "destructive",
  BLOCKED: "destructive",
  DELETED: "outline",
}

const APPLICATION_STATUS_VARIANTS: Record<HelpApplicationStatus, Variant> = {
  PENDING: "outline",
  ACCEPTED: "secondary",
  CANCELLED: "destructive",
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Badge variant={USER_STATUS_VARIANTS[status]}>{USER_STATUS_LABELS[status]}</Badge>
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <Badge variant={status === "OPEN" ? "secondary" : "outline"}>{CASE_STATUS_LABELS[status]}</Badge>
  )
}

export function HelpApplicationStatusBadge({ status }: { status: HelpApplicationStatus }) {
  return (
    <Badge variant={APPLICATION_STATUS_VARIANTS[status]}>
      {HELP_APPLICATION_STATUS_LABELS[status]}
    </Badge>
  )
}
