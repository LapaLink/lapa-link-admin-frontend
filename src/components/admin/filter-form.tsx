import Link from "next/link"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function FilterForm({
  resetHref,
  children,
}: {
  resetHref: string
  children: React.ReactNode
}) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/40 p-3">
      {children}
      <div className="ml-auto flex gap-2">
        <Button variant="ghost" nativeButton={false} render={<Link href={resetHref} />}>
          Сбросить
        </Button>
        <Button type="submit">
          <SearchIcon data-icon="inline-start" />
          Применить
        </Button>
      </div>
    </form>
  )
}
