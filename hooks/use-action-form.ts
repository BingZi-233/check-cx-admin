"use client"

import { useActionState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  idleActionState,
  type ActionErrorState,
  type ActionState,
  type FormAction,
} from "@/lib/admin/action-result"

export type UseActionFormOptions = {
  onSuccess?: (state: Extract<ActionState, { status: "success" }>) => void
  onError?: (state: ActionErrorState) => void
  /** 默认 true；设为 false 时由调用方自己决定怎么提示 */
  toastOnSuccess?: boolean
  toastOnError?: boolean
}

/**
 * 统一处理 server action 的返回值：toast 提示、字段级错误、成功后跳转。
 * 提示不再经过 URL query，所以地址栏干净、刷新和后退都不会重复弹。
 */
export function useActionForm(
  action: FormAction,
  options: UseActionFormOptions = {}
) {
  const [state, formAction, isPending] = useActionState(action, idleActionState)
  const router = useRouter()
  const handledRef = useRef<ActionState | null>(null)
  const optionsRef = useRef(options)

  // 调用方通常传字面量对象，放进依赖会每次渲染都重跑；用 ref 存最新值。
  // 这个 effect 声明在前面，所以同一次提交里它会先于下面的处理逻辑执行。
  useEffect(() => {
    optionsRef.current = options
  })

  useEffect(() => {
    if (state.status === "idle" || handledRef.current === state) {
      return
    }

    handledRef.current = state
    const currentOptions = optionsRef.current

    if (state.status === "success") {
      if (currentOptions.toastOnSuccess !== false) {
        toast.success(state.message)
      }

      currentOptions.onSuccess?.(state)

      if (state.redirectTo) {
        router.push(state.redirectTo)
      }

      return
    }

    if (currentOptions.toastOnError !== false) {
      toast.error(state.message)
    }

    currentOptions.onError?.(state)
  }, [router, state])

  return {
    state,
    formAction,
    isPending,
    fieldErrors: state.status === "error" ? (state.fieldErrors ?? {}) : {},
    errorMessage: state.status === "error" ? state.message : null,
  }
}
