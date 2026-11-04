import { RefreshButton } from "@/components/admin/refresh-button"
import { Table } from "@/components/ui/table"

export function DataTable({
  children,
  onRefresh,
}: {
  children: React.ReactNode
  /** Loader for client-fetched tables; server-rendered ones refresh by re-rendering the route. */
  onRefresh?: () => Promise<unknown> | void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <RefreshButton onRefresh={onRefresh} />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>{children}</Table>
      </div>
    </div>
  )
}
