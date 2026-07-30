"use client"

import { useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { deleteModelAction } from "@/app/dashboard/models/actions"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { ModelForm } from "@/components/admin/forms/model-form"
import { providerTypeItems } from "@/components/admin/forms/provider-type-select"
import { RecordSheet } from "@/components/admin/record-sheet"
import { RowActions } from "@/components/admin/row-actions"
import { ProviderBadge } from "@/components/admin/status-badge"
import { TableToolbar } from "@/components/admin/table-toolbar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useTableState } from "@/hooks/use-table-state"
import { formatDateTime } from "@/lib/admin/format"
import type {
  CheckModelRecord,
  CheckRequestTemplateRecord,
  ProviderType,
} from "@/lib/admin/types"

type ModelsTableProps = {
  models: CheckModelRecord[]
  templates: CheckRequestTemplateRecord[]
}

type RowDialog =
  | { kind: "edit"; model: CheckModelRecord }
  | { kind: "delete"; model: CheckModelRecord }
  | null

export function ModelsTable({ models, templates }: ModelsTableProps) {
  const [rowDialog, setRowDialog] = useState<RowDialog>(null)

  const table = useTableState<CheckModelRecord>({
    rows: models,
    searchFields: (row) => [row.model, row.template_name],
    columns: [
      { key: "model", sortValue: (row) => row.model },
      { key: "template_name", sortValue: (row) => row.template_name },
      { key: "config_count", sortValue: (row) => row.config_count ?? 0 },
      { key: "updated_at", sortValue: (row) => row.updated_at },
    ],
    filters: [
      { key: "type", match: (row, value) => row.type === value },
      {
        key: "usage",
        match: (row, value) =>
          value === "unused"
            ? (row.config_count ?? 0) === 0
            : (row.config_count ?? 0) > 0,
      },
    ],
    initialSort: { key: "updated_at", direction: "desc" },
  })

  const columns: DataTableColumn<CheckModelRecord>[] = [
    {
      id: "model",
      header: "模型",
      sortKey: "model",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setRowDialog({ kind: "edit", model: row })}
          className="font-medium hover:underline"
        >
          {row.model}
        </button>
      ),
    },
    {
      id: "type",
      header: "Provider",
      cell: (row) => <ProviderBadge type={row.type} />,
    },
    {
      id: "template_name",
      header: "模板",
      sortKey: "template_name",
      cell: (row) => (
        <span className="text-muted-foreground">{row.template_name ?? "-"}</span>
      ),
    },
    {
      id: "config_count",
      header: "引用配置",
      sortKey: "config_count",
      align: "right",
      cell: (row) => row.config_count ?? 0,
    },
    {
      id: "updated_at",
      header: "更新时间",
      sortKey: "updated_at",
      cell: (row) => (
        <span className="text-muted-foreground">
          {formatDateTime(row.updated_at)}
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
              onSelect: () => setRowDialog({ kind: "edit", model: row }),
            },
            {
              key: "delete",
              label: "删除模型",
              icon: <Trash2Icon />,
              variant: "destructive",
              separatorBefore: true,
              disabled: (row.config_count ?? 0) > 0,
              onSelect: () => setRowDialog({ kind: "delete", model: row }),
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
        searchPlaceholder="搜索模型名或模板"
        filters={[
          {
            key: "type",
            label: "全部 Provider",
            options: (Object.keys(providerTypeItems) as ProviderType[]).map(
              (type) => ({ value: type, label: providerTypeItems[type] })
            ),
          },
          {
            key: "usage",
            label: "全部引用状态",
            options: [
              { value: "used", label: "已被引用" },
              { value: "unused", label: "未被引用" },
            ],
          },
        ]}
        filterValues={table.filterValues}
        onFilterChange={table.setFilter}
        hasActiveQuery={table.hasActiveQuery}
        onReset={table.reset}
        actions={
          <RecordSheet
            trigger={
              <Button type="button">
                <PlusIcon />
                新建模型
              </Button>
            }
            title="新建模型"
            description="模型负责维护模型名和模板绑定，实例连接信息请在配置页管理。"
          >
            {(close) => <ModelForm templates={templates} onCancel={close} onSuccess={close} />}
          </RecordSheet>
        }
      />

      <DataTable
        columns={columns}
        rows={table.rows}
        rowKey={(row) => row.id}
        minWidth="min-w-[820px]"
        sort={table.sort}
        onToggleSort={table.toggleSort}
        emptyTitle={table.hasActiveQuery ? "没有匹配的模型" : "还没有任何模型"}
        emptyDescription={
          table.hasActiveQuery
            ? "换个关键词或清空筛选条件再试。"
            : "先创建模型，再去配置页引用它。"
        }
        pagination={{
          page: table.page,
          pageCount: table.pageCount,
          total: table.total,
          pageSize: table.pageSize,
          onPageChange: table.setPage,
        }}
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
              编辑模型{rowDialog?.kind === "edit" ? `：${rowDialog.model.model}` : ""}
            </SheetTitle>
            <SheetDescription>
              {rowDialog?.kind === "edit"
                ? `当前有 ${rowDialog.model.config_count ?? 0} 条配置引用它。`
                : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {rowDialog?.kind === "edit" ? (
              <ModelForm
                key={rowDialog.model.id}
                model={rowDialog.model}
                templates={templates}
                onCancel={() => setRowDialog(null)}
                onSuccess={() => setRowDialog(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmActionDialog
        open={rowDialog?.kind === "delete"}
        onOpenChange={(open) => {
          if (!open) setRowDialog(null)
        }}
        title="确认删除模型？"
        description={
          rowDialog?.kind === "delete"
            ? `将删除模型「${rowDialog.model.model}」。当前没有配置引用它，但删除后无法恢复。`
            : ""
        }
        action={deleteModelAction}
        fields={rowDialog?.kind === "delete" ? { id: rowDialog.model.id } : {}}
        confirmLabel="确认删除"
        pendingLabel="删除中"
      />
    </div>
  )
}
