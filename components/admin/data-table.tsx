"use client"

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  InboxIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SortDirection } from "@/hooks/use-table-state"
import { cn } from "@/lib/utils"

export type DataTableColumn<T> = {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  /** 传了才可点击排序，值需与 useTableState 的 columns.key 一致 */
  sortKey?: string
  className?: string
  headerClassName?: string
  width?: string
  align?: "left" | "right" | "center"
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  /** 行首的选择框等自定义单元 */
  leadingHeader?: React.ReactNode
  leadingCell?: (row: T) => React.ReactNode
  isRowSelected?: (row: T) => boolean
  sort?: { key: string; direction: SortDirection } | null
  onToggleSort?: (key: string) => void
  emptyTitle?: string
  emptyDescription?: React.ReactNode
  /** 最小宽度，横向滚动时保持列不挤压 */
  minWidth?: string
  pagination?: {
    page: number
    pageCount: number
    total: number
    pageSize: number
    onPageChange: (page: number) => void
  }
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean
  direction?: SortDirection
}) {
  if (!active) {
    return <ChevronsUpDownIcon className="size-3 opacity-40" />
  }

  return direction === "asc" ? (
    <ArrowUpIcon className="size-3" />
  ) : (
    <ArrowDownIcon className="size-3" />
  )
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  leadingHeader,
  leadingCell,
  isRowSelected,
  sort,
  onToggleSort,
  emptyTitle = "没有数据",
  emptyDescription = "调整搜索或筛选条件后再试。",
  minWidth,
  pagination,
}: DataTableProps<T>) {
  const columnCount = columns.length + (leadingCell ? 1 : 0)
  const from = pagination
    ? Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)
    : 0
  const to = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.total)
    : 0

  return (
    <div className="space-y-3">
      <div className="relative max-h-[calc(100svh-22rem)] overflow-auto rounded-lg border">
        <Table className={cn("text-xs", minWidth)}>
          {/* 表头吸顶：横向滚动看长表格时列名不会跑掉 */}
          <TableHeader className="sticky top-0 z-10 bg-background shadow-[inset_0_-1px_0_var(--border)]">
            <TableRow className="border-0 hover:bg-transparent">
              {leadingHeader ? (
                <TableHead className="w-10 text-center">{leadingHeader}</TableHead>
              ) : null}
              {columns.map((column) => {
                const sortable = Boolean(column.sortKey && onToggleSort)
                const active = sort?.key === column.sortKey

                return (
                  <TableHead
                    key={column.id}
                    style={column.width ? { width: column.width } : undefined}
                    className={cn(
                      "text-muted-foreground",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.headerClassName
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onToggleSort?.(column.sortKey!)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
                          active && "text-foreground"
                        )}
                      >
                        {column.header}
                        <SortIcon active={active} direction={sort?.direction} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  data-state={isRowSelected?.(row) ? "selected" : undefined}
                >
                  {leadingCell ? (
                    <TableCell className="text-center">{leadingCell(row)}</TableCell>
                  ) : null}
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center",
                        column.className
                      )}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="p-0">
                  <Empty className="border-0 py-12">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <InboxIcon />
                      </EmptyMedia>
                      <EmptyTitle>{emptyTitle}</EmptyTitle>
                      <EmptyDescription>{emptyDescription}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && pagination.total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            第 {from}-{to} 条，共 {pagination.total} 条
          </span>
          <div className="flex items-center gap-2">
            <span>
              第 {pagination.page} / {pagination.pageCount} 页
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="上一页"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="下一页"
              disabled={pagination.page >= pagination.pageCount}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
