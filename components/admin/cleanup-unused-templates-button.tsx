"use client"

import { cleanupUnusedTemplatesAction } from "@/app/dashboard/templates/actions"
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

type CleanupUnusedTemplatesButtonProps = {
  unusedCount: number
}

export function CleanupUnusedTemplatesButton({ unusedCount }: CleanupUnusedTemplatesButtonProps) {
  const formId = "cleanup-unused-templates"

  if (unusedCount === 0) {
    return (
      <Button type="button" variant="outline" disabled>
        清理未引用模板
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
        清理未引用模板
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认清理未引用模板？</AlertDialogTitle>
          <AlertDialogDescription>
            将删除 {unusedCount} 条当前未被任何模型引用的模板。这个操作不可恢复。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form id={formId} action={cleanupUnusedTemplatesAction} />
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
