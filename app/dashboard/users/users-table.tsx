"use client"

import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { TableToolbar } from "@/components/admin/table-toolbar"
import { Badge } from "@/components/ui/badge"
import { useTableState } from "@/hooks/use-table-state"
import { formatDateTime } from "@/lib/admin/format"
import type { AdminDirectoryUserRecord } from "@/lib/admin/types"

export function UsersTable({ users }: { users: AdminDirectoryUserRecord[] }) {
  const table = useTableState<AdminDirectoryUserRecord>({
    rows: users,
    searchFields: (row) => [row.email, row.group_name, row.auth_user_id],
    columns: [
      { key: "email", sortValue: (row) => row.email },
      { key: "group_name", sortValue: (row) => row.group_name },
      { key: "invited_at", sortValue: (row) => row.invited_at },
    ],
    filters: [
      { key: "role", match: (row, value) => row.role === value },
      {
        key: "state",
        match: (row, value) =>
          value === "activated" ? Boolean(row.activated_at) : !row.activated_at,
      },
    ],
    initialSort: { key: "invited_at", direction: "desc" },
  })

  const columns: DataTableColumn<AdminDirectoryUserRecord>[] = [
    {
      id: "email",
      header: "GitHub 邮箱",
      sortKey: "email",
      cell: (row) => <span className="font-medium">{row.email}</span>,
    },
    {
      id: "role",
      header: "角色",
      cell: (row) => (
        <Badge variant={row.role === "admin" ? "default" : "outline"}>
          {row.role === "admin" ? "管理员" : "成员"}
        </Badge>
      ),
    },
    {
      id: "group_name",
      header: "预设分组",
      sortKey: "group_name",
      cell: (row) => (
        <span className="text-muted-foreground">{row.group_name ?? "-"}</span>
      ),
    },
    {
      id: "state",
      header: "状态",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={row.activated_at ? "default" : "secondary"}>
            {row.activated_at ? "已绑定" : "待首次登录"}
          </Badge>
          {row.is_active === false ? (
            <Badge variant="outline">已停用</Badge>
          ) : null}
        </div>
      ),
    },
    {
      id: "invited_at",
      header: "写入时间",
      sortKey: "invited_at",
      cell: (row) => (
        <span className="text-muted-foreground">{formatDateTime(row.invited_at)}</span>
      ),
    },
    {
      id: "activated_at",
      header: "激活时间",
      cell: (row) => (
        <span className="text-muted-foreground">{formatDateTime(row.activated_at)}</span>
      ),
    },
    {
      id: "auth_user_id",
      header: "Auth 用户",
      cell: (row) => (
        <span className="font-mono text-muted-foreground">
          {row.auth_user_id ?? "-"}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <TableToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="搜索邮箱、分组或 Auth ID"
        filters={[
          {
            key: "role",
            label: "全部角色",
            options: [
              { value: "admin", label: "管理员" },
              { value: "member", label: "成员" },
            ],
          },
          {
            key: "state",
            label: "全部状态",
            options: [
              { value: "activated", label: "已绑定" },
              { value: "pending", label: "待首次登录" },
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
        minWidth="min-w-[960px]"
        sort={table.sort}
        onToggleSort={table.toggleSort}
        emptyTitle={table.hasActiveQuery ? "没有匹配的用户" : "允许名单还是空的"}
        emptyDescription={
          table.hasActiveQuery
            ? "换个关键词或清空筛选条件再试。"
            : "先在上面写入 GitHub 登录邮箱，对方才能登录后台。"
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
