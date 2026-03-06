import "server-only"

import {
  AvailabilityStatRecord,
  CheckConfigRecord,
  CheckHistoryRecord,
  CheckRequestTemplateRecord,
  DashboardSummary,
  GroupInfoRecord,
  PollerLeaseRecord,
  SystemNotificationRecord,
} from "@/lib/admin/types"
import { createAdminClient } from "@/lib/admin/supabase-admin"

type CountResult = {
  count: number | null
  error: Error | null
}

type CountQuery = PromiseLike<CountResult> & {
  eq: (column: string, value: unknown) => CountQuery
  in: (column: string, values: readonly string[]) => CountQuery
}

async function countRows(
  table: string,
  apply?: (query: CountQuery) => CountQuery
) {
  const client = createAdminClient()
  let query = client.from(table).select("*", { count: "exact", head: true }) as unknown as CountQuery

  if (apply) {
    query = apply(query)
  }

  const { count, error } = await query

  if (error) {
    throw error
  }

  return count ?? 0
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [
    configCount,
    enabledConfigCount,
    maintenanceConfigCount,
    templateCount,
    groupCount,
    activeNotificationCount,
    recentErrorCount,
  ] = await Promise.all([
    countRows("check_configs"),
    countRows("check_configs", (query) => query.eq("enabled", true)),
    countRows("check_configs", (query) => query.eq("is_maintenance", true)),
    countRows("check_request_templates"),
    countRows("group_info"),
    countRows("system_notifications", (query) => query.eq("is_active", true)),
    countRows("check_history", (query) =>
      query.in("status", ["failed", "validation_failed", "error"])
    ),
  ])

  return {
    configCount,
    enabledConfigCount,
    maintenanceConfigCount,
    templateCount,
    groupCount,
    activeNotificationCount,
    recentErrorCount,
  }
}

export async function listConfigs() {
  const client = createAdminClient()
  const { data, error } = await client
    .from("check_configs")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as CheckConfigRecord[]
}

export async function getConfigById(id: string) {
  const client = createAdminClient()
  const { data, error } = await client
    .from("check_configs")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as CheckConfigRecord | null
}

export async function listTemplates() {
  const client = createAdminClient()
  const { data, error } = await client
    .from("check_request_templates")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as CheckRequestTemplateRecord[]
}

export async function getTemplateById(id: string) {
  const client = createAdminClient()
  const { data, error } = await client
    .from("check_request_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as CheckRequestTemplateRecord | null
}

export async function listGroups() {
  const client = createAdminClient()
  const { data, error } = await client
    .from("group_info")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as GroupInfoRecord[]
}

export async function getGroupById(id: string) {
  const client = createAdminClient()
  const { data, error } = await client
    .from("group_info")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as GroupInfoRecord | null
}

export async function listNotifications() {
  const client = createAdminClient()
  const { data, error } = await client
    .from("system_notifications")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as SystemNotificationRecord[]
}

export async function getNotificationById(id: string) {
  const client = createAdminClient()
  const { data, error } = await client
    .from("system_notifications")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as SystemNotificationRecord | null
}

export async function listRecentHistory(limit = 120) {
  const client = createAdminClient()
  const { data, error } = await client
    .from("check_history")
    .select(
      "id, config_id, status, latency_ms, ping_latency_ms, checked_at, message, created_at, check_configs(id, name, type, model, group_name)"
    )
    .order("checked_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return ((data ?? []) as Array<
    Omit<CheckHistoryRecord, "check_configs"> & {
      check_configs?:
        | Array<Pick<CheckConfigRecord, "id" | "name" | "type" | "model" | "group_name">>
        | Pick<CheckConfigRecord, "id" | "name" | "type" | "model" | "group_name">
        | null
    }
  >).map((item) => ({
    ...item,
    check_configs: Array.isArray(item.check_configs)
      ? (item.check_configs[0] ?? null)
      : (item.check_configs ?? null),
  }))
}

export async function listAvailabilityStats() {
  const client = createAdminClient()
  const { data, error } = await client
    .from("availability_stats")
    .select("*")
    .order("config_id")

  if (error) {
    throw error
  }

  return (data ?? []) as AvailabilityStatRecord[]
}

export async function getPollerLease() {
  const client = createAdminClient()
  const { data, error } = await client
    .from("check_poller_leases")
    .select("*")
    .eq("lease_key", "poller")
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as PollerLeaseRecord | null
}
