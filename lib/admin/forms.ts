import { NotificationLevel, ProviderType } from "@/lib/admin/types"

export const nativeFormControlClassName =
  "h-7 w-full min-w-0 rounded-md border border-input bg-input/20 px-2 py-0.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-xs/relaxed dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"

export const nativeSelectClassName = `${nativeFormControlClassName} pr-7`

export function requiredString(
  formData: FormData,
  key: string,
  label: string
) {
  const value = formData.get(key)?.toString().trim()

  if (!value) {
    throw new Error(`${label} 不能为空`)
  }

  return value
}

export const requireString = requiredString

export function optionalString(formData: FormData, key: string) {
  const value = formData.get(key)?.toString().trim()

  return value || null
}

export function booleanFromForm(formData: FormData, key: string) {
  return formData.get(key) === "on"
}

export const readCheckbox = booleanFromForm

export function parseProviderType(raw: string): ProviderType {
  if (raw === "openai" || raw === "gemini" || raw === "anthropic") {
    return raw
  }

  throw new Error("Provider 类型非法")
}

export function requireProviderType(formData: FormData, key = "type") {
  return parseProviderType(requiredString(formData, key, "Provider 类型"))
}

export function parseNotificationLevel(raw: string): NotificationLevel {
  if (raw === "info" || raw === "warning" || raw === "error") {
    return raw
  }

  throw new Error("通知级别非法")
}

export function encodeMessage(message: string) {
  return encodeURIComponent(message)
}

export function withMessage(
  path: string,
  key: "success" | "error",
  message: string
) {
  const searchParams = new URLSearchParams()
  searchParams.set(key, message)

  return `${path}?${searchParams.toString()}`
}

export function toSearchParamMessage(error: unknown) {
  if (error instanceof Error) {
    return encodeURIComponent(error.message)
  }

  return encodeURIComponent("发生了未知错误")
}
