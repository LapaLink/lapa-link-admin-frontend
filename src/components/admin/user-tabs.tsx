"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const TABS = [
  { value: "cases", label: "Объявления" },
  { value: "responses", label: "Отклики" },
  { value: "events", label: "События" },
]

export function UserTabs({ userId }: { userId: string }) {
  const active = usePathname().split("/").at(-1)

  return (
    <Tabs value={active}>
      <TabsList>
        {TABS.map((tab) => (
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
