import "server-only"

import {
  AvailabilityStatRecord,
  CheckConfigRecord,
  CheckHistoryRecord,
  CheckModelRecord,
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
    modelCount,
    configCount,
    enabledConfigCount,
    maintenanceConfigCount,
    templateCount,
    groupCount,
    activeNotificationCount,
    recentErrorCount,
  ] = await Promise.all([
    countRows("check_models"),
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
    modelCount,
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
    .select(
      "id, name, type, model_id, endpoint, api_key, enabled, is_maintenance, group_name, created_at, updated_at, check_models(model, template_id, check_request_templates(id, name))"
    )
    .order("updated_at", { ascending: false })

  if (error) {
    throw error
  }

  return ((data ?? []) as Array<
    Omit<CheckConfigRecord, "model" | "template_id" | "template_name"> & {
      check_models?:
        | {
            model: string
            template_id: string | null
            check_request_templates?: { id: string; name: string } | Array<{ id: string; name: string }> | null
          }
        | Array<{
            model: string
            template_id: string | null
            check_request_templates?: { id: string; name: string } | Array<{ id: string; name: string }> | null
          }>
        | null
    }
  >).map((item) => ({
    ...item,
    model: Array.isArray(item.check_models)
      ? (item.check_models[0]?.model ?? "")
      : (item.check_models?.model ?? ""),
    template_id: (() => {
      const model = Array.isArray(item.check_models) ? item.check_models[0] : item.check_models
      return model?.template_id ?? null
    })(),
    template_name: (() => {
      const model = Array.isArray(item.check_models) ? item.check_models[0] : item.check_models
      const template = Array.isArray(model?.check_request_templates)
        ? model.check_request_templates[0]
        : model?.check_request_templates
      return template?.name ?? null
    })(),
  }))
}

export async function getConfigById(id: string) {
  const client = createAdminClient()
  const { data, error } = await client
    .from("check_configs")
    .select(
      "id, name, type, model_id, endpoint, api_key, enabled, is_maintenance, group_name, created_at, updated_at, check_models(model, template_id, check_request_templates(id, name))"
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const typed = data as Omit<CheckConfigRecord, "model" | "template_id" | "template_name"> & {
    check_models?:
      | {
          model: string
          template_id: string | null
          check_request_templates?: { id: string; name: string } | Array<{ id: string; name: string }> | null
        }
      | Array<{
          model: string
          template_id: string | null
          check_request_templates?: { id: string; name: string } | Array<{ id: string; name: string }> | null
        }>
      | null
  }

  const model = Array.isArray(typed.check_models) ? typed.check_models[0] : typed.check_models
  const template = Array.isArray(model?.check_request_templates)
    ? model.check_request_templates[0]
    : model?.check_request_templates

  return {
    ...typed,
    model: model?.model ?? "",
    template_id: model?.template_id ?? null,
    template_name: template?.name ?? null,
  } as CheckConfigRecord
}

export async function listModels() {
  const client = createAdminClient()
  const [{ data, error }, configs] = await Promise.all([
    client
      .from("check_models")
      .select("*, check_request_templates(name)")
      .order("updated_at", { ascending: false }),
    client.from("check_configs").select("model_id"),
  ])

  if (error) {
    throw error
  }

  if (configs.error) {
    throw configs.error
  }

  const countMap = new Map<string, number>()
  for (const item of configs.data ?? []) {
    const current = countMap.get(item.model_id) ?? 0
    countMap.set(item.model_id, current + 1)
  }

  return ((data ?? []) as Array<
    Omit<CheckModelRecord, "template_name"> & {
      check_request_templates?: { name: string } | Array<{ name: string }> | null
    }
  >).map((item) => ({
    ...item,
    template_name: Array.isArray(item.check_request_templates)
      ? (item.check_request_templates[0]?.name ?? null)
      : (item.check_request_templates?.name ?? null),
    config_count: countMap.get(item.id) ?? 0,
  }))
}

export async function listModelsByType(type: CheckModelRecord["type"]) {
  const client = createAdminClient()
  const { data, error } = await client
    .from("check_models")
    .select("*")
    .eq("type", type)
    .order("model", { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as CheckModelRecord[]
}

export async function getModelById(id: string) {
  const client = createAdminClient()
  const [{ data, error }, configs] = await Promise.all([
    client
      .from("check_models")
      .select("*, check_request_templates(name)")
      .eq("id", id)
      .maybeSingle(),
    client.from("check_configs").select("id", { count: "exact", head: true }).eq("model_id", id),
  ])

  if (error) {
    throw error
  }

  if (configs.error) {
    throw configs.error
  }

  if (!data) {
    return null
  }

  return {
    ...(data as Omit<CheckModelRecord, "template_name"> & {
      check_request_templates?: { name: string } | Array<{ name: string }> | null
    }),
    template_name: Array.isArray(data.check_request_templates)
      ? (data.check_request_templates[0]?.name ?? null)
      : (data.check_request_templates?.name ?? null),
    config_count: configs.count ?? 0,
  } satisfies CheckModelRecord
}

export async function listTemplates() {
  const client = createAdminClient()
  const [{ data, error }, models] = await Promise.all([
    client
      .from("check_request_templates")
      .select("*")
      .order("updated_at", { ascending: false }),
    client.from("check_models").select("template_id"),
  ])

  if (error) {
    throw error
  }

  if (models.error) {
    throw models.error
  }

  const countMap = new Map<string, number>()
  for (const item of models.data ?? []) {
    if (!item.template_id) {
      continue
    }

    const current = countMap.get(item.template_id) ?? 0
    countMap.set(item.template_id, current + 1)
  }

  return ((data ?? []) as CheckRequestTemplateRecord[]).map((item) => ({
    ...item,
    model_count: countMap.get(item.id) ?? 0,
  }))
}

export async function getTemplateById(id: string) {
  const client = createAdminClient()
  const [{ data, error }, models] = await Promise.all([
    client
      .from("check_request_templates")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    client.from("check_models").select("id", { count: "exact", head: true }).eq("template_id", id),
  ])

  if (error) {
    throw error
  }

  if (models.error) {
    throw models.error
  }

  if (!data) {
    return null
  }

  return {
    ...(data as CheckRequestTemplateRecord),
    model_count: models.count ?? 0,
  } satisfies CheckRequestTemplateRecord
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
      "id, config_id, status, latency_ms, ping_latency_ms, checked_at, message, created_at, check_configs(id, name, type, model_id, group_name, check_models(model))"
    )
    .order("checked_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return ((data ?? []) as Array<
    Omit<CheckHistoryRecord, "check_configs"> & {
      check_configs?:
        | Array<
            Pick<CheckConfigRecord, "id" | "name" | "type" | "model_id" | "group_name"> & {
              check_models?: { model: string } | Array<{ model: string }> | null
            }
          >
        | (Pick<CheckConfigRecord, "id" | "name" | "type" | "model_id" | "group_name"> & {
            check_models?: { model: string } | Array<{ model: string }> | null
          })
        | null
    }
  >).map((item) => ({
    ...item,
    check_configs: (() => {
      const config = Array.isArray(item.check_configs)
        ? (item.check_configs[0] ?? null)
        : (item.check_configs ?? null)

      if (!config) {
        return null
      }

      return {
        id: config.id,
        name: config.name,
        type: config.type,
        model_id: config.model_id,
        model: Array.isArray(config.check_models)
          ? (config.check_models[0]?.model ?? "")
          : (config.check_models?.model ?? ""),
        group_name: config.group_name,
      }
    })(),
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
