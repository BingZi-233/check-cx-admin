import { Skeleton } from "@/components/ui/skeleton"

/** 页头骨架：标题 + 描述 + 右侧操作 */
export function PageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {withAction ? <Skeleton className="h-7 w-28 shrink-0" /> : null}
    </div>
  )
}

/** 工具条骨架：搜索框 + 若干筛选下拉 */
export function TableToolbarSkeleton({ filters = 3 }: { filters?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Skeleton className="h-7 w-full sm:w-64" />
      {Array.from({ length: filters }).map((_, index) => (
        <Skeleton key={index} className="h-7 w-28" />
      ))}
    </div>
  )
}

export function TableSkeleton({
  rows = 8,
  columns = 6,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-4 border-b px-2 py-2.5">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 border-b px-2 py-3 last:border-0"
        >
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className="h-3.5 flex-1"
              style={{ opacity: 1 - rowIndex * 0.06 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** 列表页通用加载态：页头 + 工具条 + 表格 */
export function ListPageSkeleton({
  filters = 3,
  columns = 6,
  rows = 8,
  withAction = true,
}: {
  filters?: number
  columns?: number
  rows?: number
  withAction?: boolean
}) {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton withAction={withAction} />
      <div className="space-y-3">
        <TableToolbarSkeleton filters={filters} />
        <TableSkeleton rows={rows} columns={columns} />
      </div>
    </div>
  )
}
