import Link from "next/link"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"

import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

/**
 * Column header that sorts the table on the backend through the `sort` query parameter.
 * Clicks cycle ascending → descending → the default order; the page number is reset on every change.
 */
export function SortableHead({
  field,
  label,
  sort,
  defaultSort,
  basePath,
  params,
  className,
}: {
  field: string
  label: string
  /** Current `sort` parameter, if any. */
  sort: string | undefined
  /** Order the backend applies when `sort` is absent, e.g. "createdAt,desc". */
  defaultSort: string
  basePath: string
  /** The other query parameters to keep in the link. */
  params: Record<string, string | undefined>
  className?: string
}) {
  const [activeField, direction] = (sort ?? defaultSort).split(",")
  const active = activeField === field
  const next = !active ? `${field},asc` : direction === "asc" ? `${field},desc` : undefined

  const query = new URLSearchParams()
  Object.entries({ ...params, page: undefined, sort: next === defaultSort ? undefined : next }).forEach(
    ([key, value]) => {
      if (value) query.set(key, value)
    }
  )
  const href = query.size ? `${basePath}?${query}` : basePath
  const Icon = !active ? ArrowUpDownIcon : direction === "asc" ? ArrowUpIcon : ArrowDownIcon

  return (
    <TableHead aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : undefined} className={className}>
      <Link href={href} className="-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-foreground">
        {label}
        <Icon className={cn("size-3.5", !active && "opacity-40")} aria-hidden />
      </Link>
    </TableHead>
  )
}
