"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Privilege } from "@/lib/auth/privileges"

const TABS: { value: string; label: string; privilege?: Privilege }[] = [
  { value: "cases", label: "Объявления" },
  { value: "responses", label: "Отклики" },
  { value: "events", label: "События", privilege: "AUDIT_LOG_READ" },
]

export function UserTabs({ userId, privileges }: { userId: string; privileges: Privilege[] }) {
  const active = usePathname().split("/").at(-1)

  return (
    <Tabs value={active}>
      <TabsList>
        {TABS.filter((tab) => !tab.privilege || privileges.includes(tab.privilege)).map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            nativeButton={false}
            render={<Link href={`/admin/users/${userId}/${tab.value}`} />}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
