import { ValidationError } from "@/lib/admin/action-result"
import { NotificationLevel, ProviderType } from "@/lib/admin/types"

export function requiredString(
  formData: FormData,
  key: string,
  label: string
) {
  const value = formData.get(key)?.toString().trim()

  if (!value) {
    throw new ValidationError(key, `${label} 不能为空`)
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

export function parseProviderType(raw: string, key = "type"): ProviderType {
  if (raw === "openai" || raw === "gemini" || raw === "anthropic") {
    return raw
  }

  throw new ValidationError(key, "Provider 类型非法")
}

export function requireProviderType(formData: FormData, key = "type") {
  return parseProviderType(requiredString(formData, key, "Provider 类型"), key)
}

export function parseNotificationLevel(
  raw: string,
  key = "level"
): NotificationLevel {
  if (raw === "info" || raw === "warning" || raw === "error") {
    return raw
  }

  throw new ValidationError(key, "通知级别非法")
}
