import { NotificationLevel, ProviderType } from "@/lib/admin/types"

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
