"use client"

import {
  CircleCheckIcon,
  CircleSlashIcon,
  EraserIcon,
  PencilIcon,
  Trash2Icon,
  WrenchIcon,
  XIcon,
} from "lucide-react"

import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { SubmitButton } from "@/components/admin/submit-button"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useActionForm } from "@/hooks/use-action-form"
import type { FormAction } from "@/lib/admin/action-result"

type BulkActionBarProps = {
  selectedIds: string[]
  action: FormAction
  onClear: () => void
  onOpenBulkEdit: () => void
  onSuccess?: () => void
}

/**
 * 只在有选中项时从底部浮现。
 * 旧实现是一条常驻的 9 按钮工具条，未选中时全 disabled 却依然占满一行。
 */
export function BulkActionBar({
  selectedIds,
  action,
  onClear,
  onOpenBulkEdit,
  onSuccess,
}: BulkActionBarProps) {
  const { formAction, isPending } = useActionForm(action, { onSuccess })

  if (selectedIds.length === 0) {
    return null
  }

  const hiddenIds = selectedIds.map((id) => (
    <input key={id} type="hidden" name="ids" value={id} />
  ))

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-2 overflow-x-auto rounded-full border bg-popover/95 px-3 py-2 shadow-lg backdrop-blur supports-backdrop-filter:bg-popover/80">
        <span className="shrink-0 pl-1 text-xs font-medium">
          已选 {selectedIds.length} 条
        </span>
        <Separator orientation="vertical" className="h-5" />
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          {hiddenIds}
          <SubmitButton
            name="operation"
            value="enable"
            variant="outline"
            size="sm"
            isPending={isPending}
          >
            <CircleCheckIcon />
            启用
          </SubmitButton>
          <SubmitButton
            name="operation"
            value="disable"
            variant="outline"
            size="sm"
            isPending={isPending}
          >
            <CircleSlashIcon />
            停用
          </SubmitButton>
          <SubmitButton
            name="operation"
            value="maintenance_on"
            variant="outline"
            size="sm"
            isPending={isPending}
          >
            <WrenchIcon />
            维护
          </SubmitButton>
          <SubmitButton
            name="operation"
            value="maintenance_off"
            variant="outline"
            size="sm"
            isPending={isPending}
          >
            取消维护
          </SubmitButton>
        </form>
        <Button type="button" variant="outline" size="sm" onClick={onOpenBulkEdit}>
          <PencilIcon />
          批量修改
        </Button>
        <ConfirmActionDialog
          trigger={
            <Button type="button" variant="outline" size="sm">
              <EraserIcon />
              清理历史
            </Button>
          }
          title="确认批量清理请求历史？"
          description={`将清理选中 ${selectedIds.length} 条配置在 check_history 里的全部请求历史。配置本身不受影响，但历史记录不可恢复。`}
          action={action}
          fields={{ ids: selectedIds, operation: "clear_history" }}
          confirmLabel="确认清理"
          pendingLabel="清理中"
          onSuccess={onSuccess}
        />
        <ConfirmActionDialog
          trigger={
            <Button type="button" variant="destructive" size="sm">
              <Trash2Icon />
              删除
            </Button>
          }
          title="确认批量删除配置？"
          description={`将删除选中的 ${selectedIds.length} 条配置，相关检测历史会一起级联删除。这个操作不可恢复。`}
          action={action}
          fields={{ ids: selectedIds, operation: "delete" }}
          confirmLabel="确认删除"
          pendingLabel="删除中"
          onSuccess={onSuccess}
        />
        <Separator orientation="vertical" className="h-5" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="取消选择"
          onClick={onClear}
        >
          <XIcon />
        </Button>
      </div>
    </div>
  )
}
