"use client"

import { cleanupUnusedModelsAction } from "@/app/dashboard/models/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type CleanupUnusedModelsButtonProps = {
  unusedCount: number
}

export function CleanupUnusedModelsButton({ unusedCount }: CleanupUnusedModelsButtonProps) {
  const formId = "cleanup-unused-models"

  if (unusedCount === 0) {
    return (
      <Button type="button" variant="outline" disabled>
        清理未引用模型
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
        清理未引用模型
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认清理未引用模型？</AlertDialogTitle>
          <AlertDialogDescription>
            将删除 {unusedCount} 条当前未被任何配置引用的模型。这个操作不可恢复。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form id={formId} action={cleanupUnusedModelsAction} />
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction type="submit" form={formId} variant="destructive">
            确认清理
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
