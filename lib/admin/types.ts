export type ProviderType = "openai" | "gemini" | "anthropic"

export type NotificationLevel = "info" | "warning" | "error"

export type HistoryStatus =
  | "operational"
  | "degraded"
  | "failed"
  | "validation_failed"
  | "error"

export type JsonPrimitive = string | number | boolean | null

export type JsonValue =
  | JsonPrimitive
  | { [key: string]: JsonValue }
  | JsonValue[]

export interface AdminUser {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
}

export interface CheckRequestTemplateRecord {
  id: string
  name: string
  type: ProviderType
  request_header: JsonValue | null
  metadata: JsonValue | null
  created_at: string | null
  updated_at: string | null
  model_count?: number
}

export interface CheckModelRecord {
  id: string
  type: ProviderType
  model: string
  template_id: string | null
  template_name?: string | null
  created_at: string | null
  updated_at: string | null
  config_count?: number
}

export interface CheckConfigRecord {
  id: string
  name: string
  type: ProviderType
  model_id: string
  model: string
  template_id: string | null
  template_name?: string | null
  endpoint: string
  api_key: string
  enabled: boolean | null
  is_maintenance: boolean | null
  group_name: string | null
  created_at: string | null
  updated_at: string | null
}

export interface GroupInfoRecord {
  id: string
  group_name: string
  website_url: string | null
  tags: string
  created_at: string | null
  updated_at: string | null
}

export interface SystemNotificationRecord {
  id: string
  message: string
  is_active: boolean | null
  level: NotificationLevel | null
  created_at: string | null
}

export interface CheckHistoryRecord {
  id: number
  config_id: string
  status: HistoryStatus
  latency_ms: number | null
  ping_latency_ms: number | null
  checked_at: string
  message: string | null
  created_at: string | null
  check_configs?: Pick<CheckConfigRecord, "id" | "name" | "type" | "model_id" | "model" | "group_name"> | null
}

export interface AvailabilityStatRecord {
  config_id: string
  period: "7d" | "15d" | "30d"
  total_checks: number
  operational_count: number
  availability_pct: number | null
}

export interface PollerLeaseRecord {
  lease_key: string
  leader_id: string | null
  lease_expires_at: string
  updated_at: string
}

export interface DashboardSummary {
  modelCount: number
  configCount: number
  enabledConfigCount: number
  maintenanceConfigCount: number
  templateCount: number
  groupCount: number
  activeNotificationCount: number
  recentErrorCount: number
}
