import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { Page } from "@/lib/api/admin-types"

type Props = {
  page: Page<unknown>
  params: Record<string, string | undefined>
}

export function TablePagination({ page, params }: Props) {
  const href = (target: number) => {
    const query = new URLSearchParams()
    Object.entries({ ...params, page: target > 0 ? String(target) : undefined }).forEach(
      ([key, value]) => value && query.set(key, value)
    )
    return `?${query}`
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">Всего: {page.totalElements}</p>
      {page.totalPages > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={page.first ? undefined : href(page.page - 1)}
                aria-disabled={page.first}
                text="Назад"
              />
            </PaginationItem>
            {pageNumbers(page.page, page.totalPages).map((number, index) => (
              <PaginationItem key={index}>
                {number === null ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink href={href(number)} isActive={number === page.page}>
                    {number + 1}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href={page.last ? undefined : href(page.page + 1)}
                aria-disabled={page.last}
                text="Вперёд"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

function pageNumbers(current: number, total: number) {
  const numbers: (number | null)[] = []
  for (let index = 0; index < total; index++) {
    if (index === 0 || index === total - 1 || Math.abs(index - current) <= 1) {
      numbers.push(index)
    } else if (numbers.at(-1) !== null) {
      numbers.push(null)
    }
  }
  return numbers
}
