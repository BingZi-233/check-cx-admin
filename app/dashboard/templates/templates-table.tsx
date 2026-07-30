"use client"

import { useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { deleteTemplateAction } from "@/app/dashboard/templates/actions"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { providerTypeItems } from "@/components/admin/forms/provider-type-select"
import { TemplateForm } from "@/components/admin/forms/template-form"
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
import type { CheckRequestTemplateRecord, ProviderType } from "@/lib/admin/types"

/** 服务端预先格式化过的 JSON 文本，key 是模板 id */
export type TemplateJsonTexts = Record<
  string,
  { requestHeader: string; metadata: string }
>

type TemplatesTableProps = {
  templates: CheckRequestTemplateRecord[]
  jsonTexts: TemplateJsonTexts
}

type RowDialog =
  | { kind: "edit"; template: CheckRequestTemplateRecord }
  | { kind: "delete"; template: CheckRequestTemplateRecord }
  | null

function summarizeJson(value: unknown) {
  if (!value) {
    return "-"
  }

  const keys = Object.keys(value as Record<string, unknown>)

  if (keys.length === 0) {
    return "-"
  }

  return keys.length <= 3 ? keys.join(", ") : `${keys.slice(0, 3).join(", ")} +${keys.length - 3}`
}

export function TemplatesTable({ templates, jsonTexts }: TemplatesTableProps) {
  const [rowDialog, setRowDialog] = useState<RowDialog>(null)

  const table = useTableState<CheckRequestTemplateRecord>({
    rows: templates,
    searchFields: (row) => [row.name],
    columns: [
      { key: "name", sortValue: (row) => row.name },
      { key: "model_count", sortValue: (row) => row.model_count ?? 0 },
      { key: "updated_at", sortValue: (row) => row.updated_at },
    ],
    filters: [
      { key: "type", match: (row, value) => row.type === value },
      {
        key: "usage",
        match: (row, value) =>
          value === "unused"
            ? (row.model_count ?? 0) === 0
            : (row.model_count ?? 0) > 0,
      },
    ],
    initialSort: { key: "updated_at", direction: "desc" },
  })

  const columns: DataTableColumn<CheckRequestTemplateRecord>[] = [
    {
      id: "name",
      header: "名称",
      sortKey: "name",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setRowDialog({ kind: "edit", template: row })}
          className="font-medium hover:underline"
        >
          {row.name}
        </button>
      ),
    },
    {
      id: "type",
      header: "Provider",
      cell: (row) => <ProviderBadge type={row.type} />,
    },
    {
      id: "request_header",
      header: "请求头字段",
      cell: (row) => (
        <span className="font-mono text-muted-foreground">
          {summarizeJson(row.request_header)}
        </span>
      ),
    },
    {
      id: "metadata",
      header: "metadata 字段",
      cell: (row) => (
        <span className="font-mono text-muted-foreground">
          {summarizeJson(row.metadata)}
        </span>
      ),
    },
    {
      id: "model_count",
      header: "引用模型",
      sortKey: "model_count",
      align: "right",
      cell: (row) => row.model_count ?? 0,
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
              onSelect: () => setRowDialog({ kind: "edit", template: row }),
            },
            {
              key: "delete",
              label: "删除模板",
              icon: <Trash2Icon />,
              variant: "destructive",
              separatorBefore: true,
              disabled: (row.model_count ?? 0) > 0,
              onSelect: () => setRowDialog({ kind: "delete", template: row }),
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
        searchPlaceholder="搜索模板名称"
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
                新建模板
              </Button>
            }
            title="新建模板"
            description="模板用于复用请求头和 metadata，减少在每条配置里重复填写。"
          >
            {(close) => <TemplateForm onCancel={close} onSuccess={close} />}
          </RecordSheet>
        }
      />

      <DataTable
        columns={columns}
        rows={table.rows}
        rowKey={(row) => row.id}
        minWidth="min-w-[900px]"
        sort={table.sort}
        onToggleSort={table.toggleSort}
        emptyTitle={table.hasActiveQuery ? "没有匹配的模板" : "还没有任何模板"}
        emptyDescription={
          table.hasActiveQuery
            ? "换个关键词或清空筛选条件再试。"
            : "模板不是必须的；有共用请求参数时再建。"
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
        <SheetContent side="right" className="w-full gap-0 sm:max-w-2xl">
          <SheetHeader className="border-b">
            <SheetTitle>
              编辑模板
              {rowDialog?.kind === "edit" ? `：${rowDialog.template.name}` : ""}
            </SheetTitle>
            <SheetDescription>
              {rowDialog?.kind === "edit"
                ? `当前有 ${rowDialog.template.model_count ?? 0} 个模型引用它。`
                : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {rowDialog?.kind === "edit" ? (
              <TemplateForm
                key={rowDialog.template.id}
                template={rowDialog.template}
                requestHeaderText={jsonTexts[rowDialog.template.id]?.requestHeader ?? ""}
                metadataText={jsonTexts[rowDialog.template.id]?.metadata ?? ""}
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
        title="确认删除模板？"
        description={
          rowDialog?.kind === "delete"
            ? `将删除模板「${rowDialog.template.name}」。当前没有模型引用它，但删除后无法恢复。`
            : ""
        }
        action={deleteTemplateAction}
        fields={rowDialog?.kind === "delete" ? { id: rowDialog.template.id } : {}}
        confirmLabel="确认删除"
        pendingLabel="删除中"
      />
    </div>
  )
}
