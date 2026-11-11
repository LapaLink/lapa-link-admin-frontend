import Image from "next/image"

import { badgeArtworkPath } from "@/lib/admin/badges/artwork"
import type { AdminBadge } from "@/lib/admin/badges/model"

export function BadgeArtwork({
  badge,
  size = 52
}: {
  badge: Pick<AdminBadge, "code" | "category" | "icon" | "imageUrl">
  size?: number
}) {
  // An uploaded image wins over the bundled artwork, which stays as the placeholder.
  if (badge.imageUrl)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={badge.imageUrl}
        width={size}
        height={size}
        alt=""
        className="shrink-0 rounded-lg object-cover"
        style={{ width: size, height: size }}
      />
    )
  return (
    <Image src={badgeArtworkPath(badge)} width={size} height={size} alt="" unoptimized className="shrink-0" />
  )
}
