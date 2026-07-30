"use client"

import { useActionForm } from "@/hooks/use-action-form"
import type { FieldErrors, FormAction } from "@/lib/admin/action-result"

export type ActionFormRenderProps = {
  isPending: boolean
  fieldErrors: FieldErrors
}

type ActionFormProps = Omit<React.ComponentProps<"form">, "action" | "children"> & {
  action: FormAction
  children: React.ReactNode | ((props: ActionFormRenderProps) => React.ReactNode)
  onSuccess?: () => void
}

/**
 * 表单壳：把 server action 的返回值接到 toast 和字段级错误上。
 * 提示不再经过 URL，所以提交后地址栏不会多出 ?success=... 之类的参数。
 */
export function ActionForm({
  action,
  children,
  onSuccess,
  ...formProps
}: ActionFormProps) {
  const { formAction, isPending, fieldErrors } = useActionForm(action, {
    onSuccess,
  })

  return (
    <form action={formAction} {...formProps}>
      {typeof children === "function"
        ? children({ isPending, fieldErrors })
        : children}
    </form>
  )
}
