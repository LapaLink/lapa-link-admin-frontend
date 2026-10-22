import { Table } from "@/components/ui/table"

export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <Table>{children}</Table>
    </div>
  )
}
