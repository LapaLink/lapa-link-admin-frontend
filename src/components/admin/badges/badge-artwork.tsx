import Image from "next/image"

import { badgeArtworkPath } from "@/lib/admin/badges/artwork"
import type { AdminBadge } from "@/lib/admin/badges/model"

export function BadgeArtwork({
  badge,
  size = 52
}: {
  badge: Pick<AdminBadge, "code" | "category" | "icon">
  size?: number
}) {
  return (
    <Image src={badgeArtworkPath(badge)} width={size} height={size} alt="" unoptimized className="shrink-0" />
  )
}
