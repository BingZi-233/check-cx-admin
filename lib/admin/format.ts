import { HistoryStatus, NotificationLevel, ProviderType } from "@/lib/admin/types"

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "-"
  }

  return dateTimeFormatter.format(new Date(value))
}

export function maskSecret(secret?: string | null) {
  if (!secret) {
    return "-"
  }

  if (secret.length <= 8) {
    return "********"
  }

  return `${secret.slice(0, 4)}••••${secret.slice(-4)}`
}

export function providerLabel(type: ProviderType) {
  switch (type) {
    case "openai":
      return "OpenAI"
    case "gemini":
      return "Gemini"
    case "anthropic":
      return "Anthropic"
    default:
      return type
  }
}

export function notificationLevelLabel(level: NotificationLevel | null) {
  switch (level) {
    case "warning":
      return "警告"
    case "error":
      return "错误"
    case "info":
    default:
      return "信息"
  }
}

export function historyStatusLabel(status: HistoryStatus) {
  switch (status) {
    case "operational":
      return "正常"
    case "degraded":
      return "降级"
    case "failed":
      return "失败"
    case "validation_failed":
      return "校验失败"
    case "error":
    default:
      return "错误"
  }
}

export function splitTags(tags?: string | null) {
  return (tags ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}
