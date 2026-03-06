import { Badge } from "@/components/ui/badge"
import {
  historyStatusLabel,
  notificationLevelLabel,
  providerLabel,
} from "@/lib/admin/format"
import { HistoryStatus, NotificationLevel, ProviderType } from "@/lib/admin/types"

export function ProviderBadge({ type }: { type: ProviderType }) {
  return <Badge variant="outline">{providerLabel(type)}</Badge>
}

export function BooleanBadge({
  active,
  trueLabel,
  falseLabel,
}: {
  active: boolean
  trueLabel: string
  falseLabel: string
}) {
  return <Badge variant={active ? "default" : "outline"}>{active ? trueLabel : falseLabel}</Badge>
}

export function NotificationLevelBadge({ level }: { level: NotificationLevel | null }) {
  const label = notificationLevelLabel(level)
  const variant = level === "error" ? "destructive" : level === "warning" ? "outline" : "secondary"

  return <Badge variant={variant}>{label}</Badge>
}

export function HistoryStatusBadge({ status }: { status: HistoryStatus }) {
  const label = historyStatusLabel(status)
  const variant =
    status === "operational"
      ? "default"
      : status === "degraded"
        ? "secondary"
        : "destructive"

  return <Badge variant={variant}>{label}</Badge>
}
