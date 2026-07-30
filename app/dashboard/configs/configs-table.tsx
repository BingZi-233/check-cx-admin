"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CopyIcon, EraserIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import {
  batchConfigAction,
  clearConfigHistoryAction,
  deleteConfigAction,
} from "@/app/dashboard/configs/actions"
import { BulkActionBar } from "@/components/admin/bulk-action-bar"
import { BulkEditSheet } from "@/components/admin/bulk-edit-sheet"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { ConfigForm } from "@/components/admin/forms/config-form"
import { providerTypeItems } from "@/components/admin/forms/provider-type-select"
import { RowActions } from "@/components/admin/row-actions"
import { BooleanBadge, ProviderBadge } from "@/components/admin/status-badge"
import { TableToolbar } from "@/components/admin/table-toolbar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useTableState } from "@/hooks/use-table-state"
import { formatDate, formatDateTime, maskSecret } from "@/lib/admin/format"
import type {
  CheckConfigRecord,
  CheckModelRecord,
  ProviderType,
} from "@/lib/admin/types"

type ConfigsTableProps = {
  configs: CheckConfigRecord[]
  models: CheckModelRecord[]
  isAdmin: boolean
  groupNames: string[]
  memberGroupName?: string | null
}

type RowDialog =
  | { kind: "edit"; config: CheckConfigRecord }
  | { kind: "clear-history"; config: CheckConfigRecord }
  | { kind: "delete"; config: CheckConfigRecord }
  | null

function getSingleProviderType(
  configs: CheckConfigRecord[],
  selectedIds: string[]
): ProviderType | null {
  const types = new Set(
    configs
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => item.type)
  )

  return types.size === 1 ? [...types][0] : null
}

export function ConfigsTable({
  configs,
  models,
  isAdmin,
  groupNames,
  memberGroupName,
}: ConfigsTableProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [rowDialog, setRowDialog] = useState<RowDialog>(null)

  const groupOptions = useMemo(
    () =>
      Array.from(
        new Set(
          configs
            .map((item) => item.group_name?.trim())
            .filter((item): item is string => Boolean(item))
        )
      )
        .sort((left, right) => left.localeCompare(right, "zh-Hans-CN"))
        .map((name) => ({ value: name, label: name })),
    [configs]
  )

  const templateOptions = useMemo(
    () => [
      { value: "__none__", label: "无模板" },
      ...Array.from(
        new Set(
          configs
            .map((item) => item.template_name?.trim())
            .filter((item): item is string => Boolean(item))
        )
      )
        .sort((left, right) => left.localeCompare(right, "zh-Hans-CN"))
        .map((name) => ({ value: name, label: name })),
    ],
    [configs]
  )

  const table = useTableState<CheckConfigRecord>({
    rows: configs,
    searchFields: (row) => [
      row.name,
      row.endpoint,
      row.model,
      row.group_name,
      row.template_name,
    ],
    columns: [
      { key: "name", sortValue: (row) => row.name },
      { key: "model", sortValue: (row) => row.model },
      { key: "group_name", sortValue: (row) => row.group_name },
      { key: "updated_at", sortValue: (row) => row.updated_at },
    ],
    filters: [
      { key: "type", match: (row, value) => row.type === value },
      { key: "group_name", match: (row, value) => row.group_name === value },
      {
        key: "template",
        match: (row, value) =>
          value === "__none__"
            ? !row.template_name
            : row.template_name === value,
      },
      {
        key: "state",
        match: (row, value) => {
          if (value === "enabled") return Boolean(row.enabled)
          if (value === "disabled") return !row.enabled
          if (value === "maintenance") return Boolean(row.is_maintenance)
          return true
        },
      },
    ],
    initialSort: { key: "updated_at", direction: "desc" },
    pageSize: 20,
  })

  const visibleIds = table.rows.map((item) => item.id)
  const selectedSet = new Set(selectedIds)
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id))
  const someVisibleSelected =
    !allVisibleSelected && visibleIds.some((id) => selectedSet.has(id))
  const selectedProviderType = getSingleProviderType(configs, selectedIds)

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((item) => item !== id)
    )
  }

  function toggleVisible(checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? Array.from(new Set([...current, ...visibleIds]))
        : current.filter((id) => !visibleIds.includes(id))
    )
  }

  const columns: DataTableColumn<CheckConfigRecord>[] = [
    {
      id: "name",
      header: "名称",
      sortKey: "name",
      width: "22%",
      cell: (row) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => setRowDialog({ kind: "edit", config: row })}
            className="max-w-full truncate text-left font-medium hover:underline"
          >
            {row.name}
          </button>
          <div
            className="truncate font-mono text-[0.6875rem] text-muted-foreground"
            title={row.endpoint}
          >
            {row.endpoint}
          </div>
        </div>
      ),
    },
    {
      id: "type",
      header: "Provider",
      width: "8%",
      cell: (row) => <ProviderBadge type={row.type} />,
    },
    {
      id: "model",
      header: "模型",
      sortKey: "model",
      width: "14%",
      cell: (row) => (
        <div className="truncate" title={row.model}>
          {row.model}
        </div>
      ),
    },
    {
      id: "group_name",
      header: "分组",
      sortKey: "group_name",
      width: "10%",
      cell: (row) => (
        <div className="truncate" title={row.group_name || "-"}>
          {row.group_name || "-"}
        </div>
      ),
    },
    {
      id: "template",
      header: "模板",
      width: "12%",
      cell: (row) => (
        <div className="truncate" title={row.template_name ?? "-"}>
          {row.template_name ?? "-"}
        </div>
      ),
    },
    {
      id: "state",
      header: "状态",
      width: "13%",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <BooleanBadge
            active={Boolean(row.enabled)}
            trueLabel="启用"
            falseLabel="停用"
          />
          {row.is_maintenance ? (
            <BooleanBadge active trueLabel="维护中" falseLabel="维护中" />
          ) : null}
        </div>
      ),
    },
    {
      id: "api_key",
      header: "Key",
      width: "11%",
      cell: (row) => (
        <div className="truncate font-mono" title={maskSecret(row.api_key)}>
          {maskSecret(row.api_key)}
        </div>
      ),
    },
    {
      id: "updated_at",
      header: "更新时间",
      sortKey: "updated_at",
      width: "8%",
      cell: (row) => (
        <span
          className="text-muted-foreground"
          title={formatDateTime(row.updated_at)}
        >
          {formatDate(row.updated_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      width: "44px",
      align: "right",
      cell: (row) => (
        <RowActions
          items={[
            {
              key: "edit",
              label: "编辑",
              icon: <PencilIcon />,
              onSelect: () => setRowDialog({ kind: "edit", config: row }),
            },
            {
              key: "duplicate",
              label: "复制为新配置",
              icon: <CopyIcon />,
              onSelect: () =>
                router.push(`/dashboard/configs/new?source=${row.id}`),
            },
            {
              key: "clear-history",
              label: "清理请求历史",
              icon: <EraserIcon />,
              separatorBefore: true,
              onSelect: () => setRowDialog({ kind: "clear-history", config: row }),
            },
            {
              key: "delete",
              label: "删除配置",
              icon: <Trash2Icon />,
              variant: "destructive",
              onSelect: () => setRowDialog({ kind: "delete", config: row }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <TableToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="搜索名称、端点、模型、分组"
        filters={[
          {
            key: "type",
            label: "全部 Provider",
            options: (Object.keys(providerTypeItems) as ProviderType[]).map(
              (type) => ({ value: type, label: providerTypeItems[type] })
            ),
          },
          { key: "group_name", label: "全部分组", options: groupOptions },
          { key: "template", label: "全部模板", options: templateOptions },
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
        actions={
          <Button render={<Link href="/dashboard/configs/new" />}>
            <PlusIcon />
            新建配置
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={table.rows}
        rowKey={(row) => row.id}
        minWidth="min-w-[1180px]"
        sort={table.sort}
        onToggleSort={table.toggleSort}
        isRowSelected={(row) => selectedSet.has(row.id)}
        leadingHeader={
          <Checkbox
            aria-label="全选当前页"
            checked={allVisibleSelected}
            indeterminate={someVisibleSelected}
            onCheckedChange={(checked) => toggleVisible(Boolean(checked))}
          />
        }
        leadingCell={(row) => (
          <Checkbox
            aria-label={`选中 ${row.name}`}
            checked={selectedSet.has(row.id)}
            onCheckedChange={(checked) => toggleRow(row.id, Boolean(checked))}
          />
        )}
        emptyTitle={
          table.hasActiveQuery ? "没有匹配的配置" : "还没有任何配置"
        }
        emptyDescription={
          table.hasActiveQuery
            ? "换个关键词或清空筛选条件再试。"
            : "点右上角「新建配置」添加第一条检测实例。"
        }
        pagination={{
          page: table.page,
          pageCount: table.pageCount,
          total: table.total,
          pageSize: table.pageSize,
          onPageChange: table.setPage,
        }}
      />

      <BulkActionBar
        selectedIds={selectedIds}
        action={batchConfigAction}
        onClear={() => setSelectedIds([])}
        onOpenBulkEdit={() => setBulkEditOpen(true)}
        onSuccess={() => setSelectedIds([])}
      />

      <BulkEditSheet
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedIds={selectedIds}
        models={models}
        selectedProviderType={selectedProviderType}
        onSuccess={() => setSelectedIds([])}
      />

      <Sheet
        open={rowDialog?.kind === "edit"}
        onOpenChange={(open) => {
          if (!open) setRowDialog(null)
        }}
      >
        <SheetContent side="right" className="w-full gap-0 sm:max-w-xl">
          <SheetHeader className="border-b">
            <SheetTitle>
              编辑配置{rowDialog?.kind === "edit" ? `：${rowDialog.config.name}` : ""}
            </SheetTitle>
            <SheetDescription>
              配置只保存连接信息，请求参数默认值跟着模型绑定的模板走。
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {rowDialog?.kind === "edit" ? (
              <ConfigForm
                key={rowDialog.config.id}
                config={rowDialog.config}
                models={models}
                groupNames={groupNames}
                isAdmin={isAdmin}
                memberGroupName={memberGroupName}
                onCancel={() => setRowDialog(null)}
                onSuccess={() => setRowDialog(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmActionDialog
        open={rowDialog?.kind === "clear-history"}
        onOpenChange={(open) => {
          if (!open) setRowDialog(null)
        }}
        title="确认清理这条配置的请求历史？"
        description={
          rowDialog?.kind === "clear-history"
            ? `将清理配置「${rowDialog.config.name}」在 check_history 里的全部请求历史。配置本身不受影响，但历史记录不可恢复。`
            : ""
        }
        action={clearConfigHistoryAction}
        fields={
          rowDialog?.kind === "clear-history" ? { id: rowDialog.config.id } : {}
        }
        confirmLabel="确认清理"
        pendingLabel="清理中"
      />

      <ConfirmActionDialog
        open={rowDialog?.kind === "delete"}
        onOpenChange={(open) => {
          if (!open) setRowDialog(null)
        }}
        title="确认删除这条配置？"
        description={
          rowDialog?.kind === "delete"
            ? `将删除配置「${rowDialog.config.name}」，它的检测历史会一起级联删除。这个操作不可恢复。`
            : ""
        }
        action={deleteConfigAction}
        fields={rowDialog?.kind === "delete" ? { id: rowDialog.config.id } : {}}
        confirmLabel="确认删除"
        pendingLabel="删除中"
      />
    </div>
  )
}
