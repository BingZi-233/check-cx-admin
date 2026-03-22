"use client"

import Link from "next/link"

import { deleteModelAction } from "@/app/dashboard/models/actions"
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

type ModelRowActionsProps = {
  id: string
  model: string
  configCount: number
}

export function ModelRowActions({ id, model, configCount }: ModelRowActionsProps) {
  const isDeleteDisabled = configCount > 0
  const deleteFormId = `delete-model-${id}`

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        render={<Link href={`/dashboard/models/${id}`} />}
      >
        编辑
      </Button>
      {isDeleteDisabled ? (
        <Button type="button" variant="destructive" disabled>
          删除
        </Button>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button type="button" variant="destructive" />}
          >
            删除
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除模型？</AlertDialogTitle>
              <AlertDialogDescription>
                将删除模型「{model}」。当前没有配置引用它，但删除后无法恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form id={deleteFormId} action={deleteModelAction}>
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
