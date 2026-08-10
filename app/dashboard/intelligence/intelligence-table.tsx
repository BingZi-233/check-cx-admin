"use client"

import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { TableToolbar } from "@/components/admin/table-toolbar"
import { Badge } from "@/components/ui/badge"
import { useTableState } from "@/hooks/use-table-state"
import type { IntelligenceStatRecord } from "@/lib/admin/types"
import { cn } from "@/lib/utils"

function RateCell({ value }: { value: number | null }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <span
      className={cn(
        "font-medium",
        value >= 90 && "text-emerald-600 dark:text-emerald-400",
        value < 90 && value >= 60 && "text-amber-600 dark:text-amber-400",
        value < 60 && "text-destructive"
      )}
    >
      {value}%
    </span>
  )
}

function ScoreBadge({ value }: { value: number | null }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>
  }

  const variant =
    value >= 80 ? "default" : value >= 50 ? "secondary" : "destructive"

  return <Badge variant={variant}>{value}</Badge>
}

export function IntelligenceTable({ stats }: { stats: IntelligenceStatRecord[] }) {
  const table = useTableState<IntelligenceStatRecord>({
    rows: stats,
    searchFields: (row) => [row.name ?? "", row.model ?? "", row.group_name ?? ""],
    columns: [
      { key: "name", sortValue: (row) => row.name ?? "" },
      { key: "total_score", sortValue: (row) => row.total_score },
      { key: "total_samples", sortValue: (row) => row.total_samples },
    ],
    initialSort: { key: "total_score", direction: "desc" },
    pageSize: 25,
  })

  const columns: DataTableColumn<IntelligenceStatRecord>[] = [
    {
      id: "name",
      header: "配置",
      sortKey: "name",
      width: "24%",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.name ?? row.config_id}</span>
          {row.model ? (
            <span className="text-xs text-muted-foreground">{row.model}</span>
          ) : null}
        </div>
      ),
    },
    {
      id: "group_name",
      header: "分组",
      cell: (row) =>
        row.group_name ? (
          <span>{row.group_name}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "total_score",
      header: "综合得分",
      sortKey: "total_score",
      align: "right",
      cell: (row) => <ScoreBadge value={row.total_score} />,
    },
    {
      id: "d1",
      header: "D1 分类",
      align: "right",
      cell: (row) => <RateCell value={row.d1_pass_rate} />,
    },
    {
      id: "d2",
      header: "D2 阅读",
      align: "right",
      cell: (row) => <RateCell value={row.d2_pass_rate} />,
    },
    {
      id: "d3",
      header: "D3 状态",
      align: "right",
      cell: (row) => <RateCell value={row.d3_pass_rate} />,
    },
    {
      id: "d4",
      header: "D4 逻辑",
      align: "right",
      cell: (row) => <RateCell value={row.d4_pass_rate} />,
    },
    {
      id: "d5",
      header: "D5 指令",
      align: "right",
      cell: (row) => <RateCell value={row.d5_pass_rate} />,
    },
    {
      id: "total_samples",
      header: "样本数",
      sortKey: "total_samples",
      align: "right",
      cell: (row) => <span>{row.total_samples}</span>,
    },
  ]

  return (
    <div className="space-y-3">
      <TableToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="搜索配置名、模型或分组"
        filters={[]}
        filterValues={table.filterValues}
        onFilterChange={table.setFilter}
        hasActiveQuery={table.hasActiveQuery}
        onReset={table.reset}
      />

      <DataTable
        columns={columns}
        rows={table.rows}
        rowKey={(row) => row.config_id}
        minWidth="min-w-[860px]"
        sort={table.sort}
        onToggleSort={table.toggleSort}
        emptyTitle={table.hasActiveQuery ? "没有匹配的配置" : "暂无评估数据"}
        emptyDescription={
          table.hasActiveQuery
            ? "换个关键词或清空筛选条件再试。"
            : "等待轮询累积挑战记录后，此处会自动出分。"
        }
        pagination={{
          page: table.page,
          pageCount: table.pageCount,
          total: table.total,
          pageSize: table.pageSize,
          onPageChange: table.setPage,
        }}
      />
    </div>
  )
}
