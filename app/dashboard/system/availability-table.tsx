"use client"

import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { providerTypeItems } from "@/components/admin/forms/provider-type-select"
import { ProviderBadge } from "@/components/admin/status-badge"
import { TableToolbar } from "@/components/admin/table-toolbar"
import { Badge } from "@/components/ui/badge"
import { useTableState } from "@/hooks/use-table-state"
import type { ProviderType } from "@/lib/admin/types"
import { cn } from "@/lib/utils"

export type AvailabilityRow = {
  id: string
  name: string
  type: ProviderType
  groupName: string | null
  enabled: boolean
  isMaintenance: boolean
  pct7d: number | null
  pct15d: number | null
  pct30d: number | null
}

function PctCell({ value }: { value: number | null }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>
  }

  return (
    <span
      className={cn(
        "font-medium",
        value >= 99 && "text-emerald-600 dark:text-emerald-400",
        value < 99 && value >= 95 && "text-amber-600 dark:text-amber-400",
        value < 95 && "text-destructive"
      )}
    >
      {value}%
    </span>
  )
}

export function AvailabilityTable({ rows }: { rows: AvailabilityRow[] }) {
  const table = useTableState<AvailabilityRow>({
    rows,
    searchFields: (row) => [row.name, row.groupName],
    columns: [
      { key: "name", sortValue: (row) => row.name },
      { key: "pct7d", sortValue: (row) => row.pct7d },
      { key: "pct30d", sortValue: (row) => row.pct30d },
    ],
    filters: [
      { key: "type", match: (row, value) => row.type === value },
      {
        key: "state",
        match: (row, value) => {
          if (value === "enabled") return row.enabled
          if (value === "disabled") return !row.enabled
          if (value === "maintenance") return row.isMaintenance
          return true
        },
      },
    ],
    initialSort: { key: "pct7d", direction: "asc" },
    pageSize: 25,
  })

  const columns: DataTableColumn<AvailabilityRow>[] = [
    {
      id: "name",
      header: "配置",
      sortKey: "name",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      id: "type",
      header: "类型",
      cell: (row) => <ProviderBadge type={row.type} />,
    },
    {
      id: "pct7d",
      header: "7 天",
      sortKey: "pct7d",
      align: "right",
      cell: (row) => <PctCell value={row.pct7d} />,
    },
    {
      id: "pct15d",
      header: "15 天",
      align: "right",
      cell: (row) => <PctCell value={row.pct15d} />,
    },
    {
      id: "pct30d",
      header: "30 天",
      sortKey: "pct30d",
      align: "right",
      cell: (row) => <PctCell value={row.pct30d} />,
    },
    {
      id: "state",
      header: "状态",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={row.enabled ? "default" : "outline"}>
            {row.enabled ? "启用" : "停用"}
          </Badge>
          {row.isMaintenance ? <Badge variant="secondary">维护中</Badge> : null}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <TableToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="搜索配置名或分组"
        filters={[
          {
            key: "type",
            label: "全部 Provider",
            options: (Object.keys(providerTypeItems) as ProviderType[]).map(
              (type) => ({ value: type, label: providerTypeItems[type] })
            ),
          },
          {
            key: "state",
            label: "全部状态",
            options: [
              { value: "enabled", label: "已启用" },
              { value: "disabled", label: "已停用" },
              { value: "maintenance", label: "维护中" },
            ],
          },
        ]}
        filterValues={table.filterValues}
        onFilterChange={table.setFilter}
        hasActiveQuery={table.hasActiveQuery}
        onReset={table.reset}
      />

      <DataTable
        columns={columns}
        rows={table.rows}
        rowKey={(row) => row.id}
        minWidth="min-w-[720px]"
        sort={table.sort}
        onToggleSort={table.toggleSort}
        emptyTitle={table.hasActiveQuery ? "没有匹配的配置" : "还没有可用性数据"}
        emptyDescription={
          table.hasActiveQuery
            ? "换个关键词或清空筛选条件再试。"
            : "availability_stats 视图里还没有累积到数据。"
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
