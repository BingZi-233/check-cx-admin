"use client"

import { useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { deleteGroupAction } from "@/app/dashboard/groups/actions"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { GroupForm } from "@/components/admin/forms/group-form"
import { RecordSheet } from "@/components/admin/record-sheet"
import { RowActions } from "@/components/admin/row-actions"
import { TableToolbar } from "@/components/admin/table-toolbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useTableState } from "@/hooks/use-table-state"
import { formatDateTime, splitTags } from "@/lib/admin/format"
import type { GroupInfoRecord } from "@/lib/admin/types"

type RowDialog =
  | { kind: "edit"; group: GroupInfoRecord }
  | { kind: "delete"; group: GroupInfoRecord }
  | null

export function GroupsTable({ groups }: { groups: GroupInfoRecord[] }) {
  const [rowDialog, setRowDialog] = useState<RowDialog>(null)

  const table = useTableState<GroupInfoRecord>({
    rows: groups,
    searchFields: (row) => [row.group_name, row.website_url, row.tags],
    columns: [
      { key: "group_name", sortValue: (row) => row.group_name },
      { key: "updated_at", sortValue: (row) => row.updated_at },
    ],
    initialSort: { key: "group_name", direction: "asc" },
  })

  const columns: DataTableColumn<GroupInfoRecord>[] = [
    {
      id: "group_name",
      header: "分组名",
      sortKey: "group_name",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setRowDialog({ kind: "edit", group: row })}
          className="font-medium hover:underline"
        >
          {row.group_name}
        </button>
      ),
    },
    {
      id: "website_url",
      header: "网站",
      cell: (row) =>
        row.website_url ? (
          <a
            href={row.website_url}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {row.website_url}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      id: "tags",
      header: "标签",
      cell: (row) => {
        const tags = splitTags(row.tags)

        return tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
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
              onSelect: () => setRowDialog({ kind: "edit", group: row }),
            },
            {
              key: "delete",
              label: "删除分组",
              icon: <Trash2Icon />,
              variant: "destructive",
              separatorBefore: true,
              onSelect: () => setRowDialog({ kind: "delete", group: row }),
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
        searchPlaceholder="搜索分组名、网站或标签"
        hasActiveQuery={table.hasActiveQuery}
        onReset={table.reset}
        actions={
          <RecordSheet
            trigger={
              <Button type="button">
                <PlusIcon />
                新增分组
              </Button>
            }
            title="新增分组"
            description="分组和配置之间是文本关联而不是外键，命名尽量一次定好。"
          >
            {(close) => <GroupForm onCancel={close} onSuccess={close} />}
          </RecordSheet>
        }
      />

      <DataTable
        columns={columns}
        rows={table.rows}
        rowKey={(row) => row.id}
        minWidth="min-w-[760px]"
        sort={table.sort}
        onToggleSort={table.toggleSort}
        emptyTitle={table.hasActiveQuery ? "没有匹配的分组" : "还没有任何分组"}
        emptyDescription={
          table.hasActiveQuery
            ? "换个关键词再试。"
            : "分组会用于前台展示，也是成员权限的划分依据。"
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
        <SheetContent side="right" className="w-full gap-0 sm:max-w-lg">
          <SheetHeader className="border-b">
            <SheetTitle>
              编辑分组
              {rowDialog?.kind === "edit" ? `：${rowDialog.group.group_name}` : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {rowDialog?.kind === "edit" ? (
              <GroupForm
                key={rowDialog.group.id}
                group={rowDialog.group}
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
        title="确认删除分组？"
        description={
          rowDialog?.kind === "delete"
            ? `将删除分组「${rowDialog.group.group_name}」。引用了这个名字的配置不会自动更新，请先确认无人使用。`
            : ""
        }
        action={deleteGroupAction}
        fields={rowDialog?.kind === "delete" ? { id: rowDialog.group.id } : {}}
        confirmLabel="确认删除"
        pendingLabel="删除中"
      />
    </div>
  )
}
