import { PhoneCodeButton } from "@/components/admin/phone-code-button"
import { UserStatusBadge } from "@/components/admin/status-badges"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDateTime } from "@/lib/admin/format"
import { ROLE_LABELS } from "@/lib/admin/labels"
import type { AdminUserDetails } from "@/lib/api/admin-types"

const EMPTY = "не указано"

/**
 * Profile of the user shown in the admin section. The phone and the home point are personal data:
 * they are rendered only here and are never logged.
 */
export function UserProfile({
  user,
  cityName,
  canViewOtp,
}: {
  user: AdminUserDetails
  cityName: string | null
  canViewOtp: boolean
}) {
  const hasHome = user.homeLatitude != null && user.homeLongitude != null
  const rows: [string, React.ReactNode][] = [
    ["Email", user.email + (user.emailVerifiedAt ? "" : " (не подтверждён)")],
    [
      "Телефон",
      user.phone ? (
        <span className="flex flex-wrap items-center gap-2">
          {user.phone}
          <Badge variant={user.phoneConfirmed ? "secondary" : "outline"}>
            {user.phoneConfirmed ? "Подтверждён" : "Не подтверждён"}
          </Badge>
          {!user.phoneConfirmed && canViewOtp && <PhoneCodeButton userId={user.id} />}
        </span>
      ) : (
        EMPTY
      ),
    ],
    ["Город", user.cityCode ? (cityName ?? user.cityCode) : EMPTY],
    ["Язык", user.locale],
    ["О себе", user.bio ? <span className="whitespace-pre-line">{user.bio}</span> : EMPTY],
    ["Создан", formatDateTime(user.createdAt)],
    ["Изменён", formatDateTime(user.updatedAt)],
    ["Последний вход", user.lastLoginAt ? formatDateTime(user.lastLoginAt) : EMPTY],
  ]

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
              <AvatarFallback>{(user.displayName || user.email).slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className="text-xl font-semibold">{user.displayName || "Без имени"}</div>
              <div className="flex flex-wrap items-center gap-2">
                <UserStatusBadge status={user.status} />
                {user.roles.map((role) => (
                  <Badge key={role} variant={role === "USER" ? "outline" : "secondary"}>
                    {ROLE_LABELS[role] ?? role}
                  </Badge>
                ))}
              </div>
              <div className="font-mono text-xs text-muted-foreground">{user.id}</div>
            </div>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col gap-2 lg:w-80">
          <div className="text-sm text-muted-foreground">Домашняя точка</div>
          {hasHome ? (
            <>
              <iframe
                title="Домашняя точка"
                loading="lazy"
                className="h-48 w-full rounded-lg border"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${user.homeLongitude! - 0.01}%2C${user.homeLatitude! - 0.006}%2C${user.homeLongitude! + 0.01}%2C${user.homeLatitude! + 0.006}&layer=mapnik&marker=${user.homeLatitude}%2C${user.homeLongitude}`}
              />
              <a
                href={`https://www.openstreetmap.org/?mlat=${user.homeLatitude}&mlon=${user.homeLongitude}#map=15/${user.homeLatitude}/${user.homeLongitude}`}
                target="_blank"
                rel="noreferrer"
                className="w-fit text-sm underline-offset-4 hover:underline"
              >
                Открыть на карте
              </a>
            </>
          ) : (
            <div className="text-sm">{EMPTY}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
