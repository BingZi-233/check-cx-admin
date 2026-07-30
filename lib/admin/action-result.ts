import { unstable_rethrow } from "next/navigation"

export type FieldErrors = Record<string, string>

export type ActionState =
  | { status: "idle" }
  | { status: "success"; message: string; redirectTo?: string }
  | { status: "error"; message: string; fieldErrors?: FieldErrors }

export type ActionSuccessState = Extract<ActionState, { status: "success" }>
export type ActionErrorState = Extract<ActionState, { status: "error" }>

export type FormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>

export const idleActionState: ActionState = { status: "idle" }

/**
 * 校验失败时抛出，带上字段名，让前端把错误显示在对应字段下方而不是顶部横幅。
 */
export class ValidationError extends Error {
  readonly field: string

  constructor(field: string, message: string) {
    super(message)
    this.name = "ValidationError"
    this.field = field
  }
}

export function actionSuccess(message: string, redirectTo?: string): ActionState {
  return redirectTo
    ? { status: "success", message, redirectTo }
    : { status: "success", message }
}

export function actionError(
  message: string,
  fieldErrors?: FieldErrors
): ActionState {
  return fieldErrors
    ? { status: "error", message, fieldErrors }
    : { status: "error", message }
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim().length > 0
  ) {
    return error.message
  }

  return null
}

export function toActionError(error: unknown, fallback: string): ActionState {
  // redirect() / notFound() / dynamic bailout 都是靠抛特殊错误实现的，
  // 必须先原样抛回，否则 requireAdminUser() 的跳转会被当成业务错误吞掉。
  unstable_rethrow(error)

  const message = readErrorMessage(error) ?? fallback

  if (error instanceof ValidationError) {
    return actionError(message, { [error.field]: message })
  }

  return actionError(message)
}
