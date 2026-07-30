"use client"

import { BrushCleaningIcon } from "lucide-react"

import { cleanupUnusedModelsAction } from "@/app/dashboard/models/actions"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { Button } from "@/components/ui/button"

export function CleanupUnusedModelsButton({
  unusedCount,
}: {
  unusedCount: number
}) {
  if (unusedCount === 0) {
    return (
      <Button type="button" variant="outline" disabled>
        <BrushCleaningIcon />
        没有可清理的模型
      </Button>
    )
  }

  return (
    <ConfirmActionDialog
      trigger={
        <Button type="button" variant="outline">
          <BrushCleaningIcon />
          清理 {unusedCount} 条未引用模型
        </Button>
      }
      title="确认清理未引用模型？"
      description={`将删除 ${unusedCount} 条当前未被任何配置引用的模型。这个操作不可恢复。`}
      action={cleanupUnusedModelsAction}
      confirmLabel="确认清理"
      pendingLabel="清理中"
    />
  )
}
