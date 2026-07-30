"use client"

import { useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import {
  deleteNotificationAction,
  toggleNotificationActiveAction,
} from "@/app/dashboard/notifications/actions"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { NotificationForm } from "@/components/admin/forms/notification-form"
import { MarkdownPreview } from "@/components/admin/markdown-preview"
import { RecordSheet } from "@/components/admin/record-sheet"
import { RowActions } from "@/components/admin/row-actions"
import { NotificationLevelBadge } from "@/components/admin/status-badge"
import { TableToolbar } from "@/components/admin/table-toolbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useActionForm } from "@/hooks/use-action-form"
import { useTableState } from "@/hooks/use-table-state"
import { formatDateTime } from "@/lib/admin/format"
import type { NotificationLevel, SystemNotificationRecord } from "@/lib/admin/types"

type RowDialog =
  | { kind: "edit"; notification: SystemNotificationRecord }
  | { kind: "delete"; notification: SystemNotificationRecord }
  | null

/** 显示/隐藏用 Switch 直接提交，取代原来那颗「隐藏 / 显示」按钮 */
function ActiveSwitch({
  notification,
}: {
  notification: SystemNotificationRecord
}) {
  const { formAction, isPending } = useActionForm(toggleNotificationActiveAction)

  function handleChange(checked: boolean) {
    // 直接派发 FormData，不需要包一层 <form> 再 requestSubmit
    const payload = new FormData()
    payload.set("id", notification.id)

    if (checked) {
      payload.set("is_active", "on")
    }

    formAction(payload)
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={Boolean(notification.is_active)}
        disabled={isPending}
        onCheckedChange={handleChange}
        aria-label={notification.is_active ? "隐藏这条通知" : "显示这条通知"}
      />
      <span className="text-xs text-muted-foreground">
        {notification.is_active ? "显示中" : "已停用"}
      </span>
    </div>
  )
}

export function NotificationsList({
  notifications,
}: {
  notifications: SystemNotificationRecord[]
}) {
  const [rowDialog, setRowDialog] = useState<RowDialog>(null)

  const table = useTableState<SystemNotificationRecord>({
    rows: notifications,
    searchFields: (row) => [row.message],
    filters: [
      { key: "level", match: (row, value) => row.level === value },
      {
        key: "state",
        match: (row, value) =>
          value === "active" ? Boolean(row.is_active) : !row.is_active,
      },
    ],
    pageSize: 10,
  })

  return (
    <div className="space-y-3">
      <TableToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="搜索通知内容"
        filters={[
          {
            key: "level",
            label: "全部级别",
            options: [
              { value: "info", label: "信息" },
              { value: "warning", label: "警告" },
              { value: "error", label: "错误" },
            ] satisfies Array<{ value: NotificationLevel; label: string }>,
          },
          {
            key: "state",
            label: "全部状态",
            options: [
              { value: "active", label: "显示中" },
              { value: "inactive", label: "已停用" },
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
                新增通知
              </Button>
            }
            title="新增系统通知"
            description="内容支持 Markdown，右侧可以实时看到前台渲染效果。"
            className="w-full gap-0 sm:max-w-3xl"
          >
            {(close) => <NotificationForm onCancel={close} onSuccess={close} />}
          </RecordSheet>
        }
      />

      {table.rows.length > 0 ? (
        <div className="space-y-3">
          {table.rows.map((notification) => (
            <div key={notification.id} className="rounded-lg border p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <NotificationLevelBadge level={notification.level} />
                  <Badge variant={notification.is_active ? "default" : "outline"}>
                    {notification.is_active ? "显示中" : "已停用"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(notification.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ActiveSwitch notification={notification} />
                  <RowActions
                    items={[
                      {
                        key: "edit",
                        label: "编辑",
                        icon: <PencilIcon />,
                        onSelect: () =>
                          setRowDialog({ kind: "edit", notification }),
                      },
                      {
                        key: "delete",
                        label: "删除通知",
                        icon: <Trash2Icon />,
                        variant: "destructive",
                        separatorBefore: true,
                        onSelect: () =>
                          setRowDialog({ kind: "delete", notification }),
                      },
                    ]}
                  />
                </div>
              </div>
              <MarkdownPreview
                content={notification.message}
                className="text-muted-foreground"
              />
            </div>
          ))}
          {table.pageCount > 1 ? (
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>共 {table.total} 条</span>
              <div className="flex items-center gap-2">
                <span>
                  第 {table.page} / {table.pageCount} 页
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={table.page <= 1}
                  onClick={() => table.setPage(table.page - 1)}
                >
                  上一页
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={table.page >= table.pageCount}
                  onClick={() => table.setPage(table.page + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PlusIcon />
            </EmptyMedia>
            <EmptyTitle>
              {table.hasActiveQuery ? "没有匹配的通知" : "还没有任何通知"}
            </EmptyTitle>
            <EmptyDescription>
              {table.hasActiveQuery
                ? "换个关键词或清空筛选条件再试。"
                : "需要在前台挂横幅公告时，在这里新增一条。"}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Sheet
        open={rowDialog?.kind === "edit"}
        onOpenChange={(open) => {
          if (!open) setRowDialog(null)
        }}
      >
        <SheetContent side="right" className="w-full gap-0 sm:max-w-3xl">
          <SheetHeader className="border-b">
            <SheetTitle>编辑系统通知</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {rowDialog?.kind === "edit" ? (
              <NotificationForm
                key={rowDialog.notification.id}
                notification={rowDialog.notification}
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
        title="确认删除这条通知？"
        description="删除后无法恢复。如果只是暂时不想展示，改成「已停用」就够了。"
        action={deleteNotificationAction}
        fields={
          rowDialog?.kind === "delete" ? { id: rowDialog.notification.id } : {}
        }
        confirmLabel="确认删除"
        pendingLabel="删除中"
      />
    </div>
  )
}
