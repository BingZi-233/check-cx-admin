"use client"

import Link from "next/link"

import { deleteTemplateAction } from "@/app/dashboard/templates/actions"
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

type TemplateRowActionsProps = {
  id: string
  name: string
  modelCount: number
}

export function TemplateRowActions({ id, name, modelCount }: TemplateRowActionsProps) {
  const isDeleteDisabled = modelCount > 0
  const deleteFormId = `delete-template-${id}`

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        render={<Link href={`/dashboard/templates/${id}`} />}
      >
        编辑
      </Button>
      {isDeleteDisabled ? (
        <Button type="button" variant="destructive" disabled>
          删除
        </Button>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
            删除
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除模板？</AlertDialogTitle>
              <AlertDialogDescription>
                将删除模板「{name}」。当前没有模型引用它，但删除后无法恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form id={deleteFormId} action={deleteTemplateAction}>
              <input type="hidden" name="id" value={id} />
            </form>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction type="submit" form={deleteFormId} variant="destructive">
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
