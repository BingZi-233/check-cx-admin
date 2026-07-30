"use client"

import { BrushCleaningIcon } from "lucide-react"

import { cleanupUnusedTemplatesAction } from "@/app/dashboard/templates/actions"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { Button } from "@/components/ui/button"

export function CleanupUnusedTemplatesButton({
  unusedCount,
}: {
  unusedCount: number
}) {
  if (unusedCount === 0) {
    return (
      <Button type="button" variant="outline" disabled>
        <BrushCleaningIcon />
        没有可清理的模板
      </Button>
    )
  }

  return (
    <ConfirmActionDialog
      trigger={
        <Button type="button" variant="outline">
          <BrushCleaningIcon />
          清理 {unusedCount} 条未引用模板
        </Button>
      }
      title="确认清理未引用模板？"
      description={`将删除 ${unusedCount} 条当前未被任何模型引用的模板。这个操作不可恢复。`}
      action={cleanupUnusedTemplatesAction}
      confirmLabel="确认清理"
      pendingLabel="清理中"
    />
  )
}
