"use client"

import { useState } from "react"

import { SubmitButton } from "@/components/admin/submit-button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useActionForm } from "@/hooks/use-action-form"
import type { FormAction } from "@/lib/admin/action-result"

type ConfirmActionDialogProps = {
  /** 非受控用法：传一个 <Button>，由 AlertDialogTrigger 接管点击 */
  trigger?: React.ReactElement
  /** 受控用法：从下拉菜单里唤起时用，避免菜单收起把 trigger 一起卸载 */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description: React.ReactNode
  action: FormAction
  /** 随表单一起提交的隐藏字段，例如 { id } */
  fields?: Record<string, string | string[]>
  confirmLabel?: string
  pendingLabel?: string
  confirmVariant?: React.ComponentProps<typeof SubmitButton>["variant"]
  onSuccess?: () => void
}

/**
 * 确认弹窗 + 提交一体化。
 * 旧写法是在弹窗里塞一个隐藏 <form>，再让按钮靠 form={id} 跨 DOM 关联；
 * 这里表单直接包住 footer，按钮在提交期间会转圈禁用，成功后自动关闭。
 */
export function ConfirmActionDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
  title,
  description,
  action,
  fields,
  confirmLabel = "确认",
  pendingLabel = "处理中",
  confirmVariant = "destructive",
  onSuccess,
}: ConfirmActionDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  function setOpen(next: boolean) {
    if (!isControlled) {
      setUncontrolledOpen(next)
    }

    onOpenChange?.(next)
  }

  const { formAction, isPending } = useActionForm(action, {
    onSuccess: () => {
      setOpen(false)
      onSuccess?.()
    },
  })

  const hiddenInputs = Object.entries(fields ?? {}).flatMap(([name, value]) =>
    Array.isArray(value)
      ? value.map((item) => (
          <input key={`${name}-${item}`} type="hidden" name={name} value={item} />
        ))
      : [<input key={name} type="hidden" name={name} value={value} />]
  )

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger ? <AlertDialogTrigger render={trigger} /> : null}
      <AlertDialogContent>
        <form action={formAction} className="grid gap-3">
          {hiddenInputs}
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>取消</AlertDialogCancel>
            <SubmitButton
              variant={confirmVariant}
              isPending={isPending}
              pendingText={pendingLabel}
            >
              {confirmLabel}
            </SubmitButton>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
