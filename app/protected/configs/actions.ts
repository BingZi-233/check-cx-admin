'use server'

import { revalidatePath } from 'next/cache'

import type { ProviderType } from '@/lib/check-configs/types'
import { creatableProviderTypes, providerTypes } from '@/lib/check-configs/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { ok: true } | { ok: false; error: string }

async function requireSignedInUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) throw new Error('Unauthorized')
  return data.claims
}

function asNullIfEmpty(value: string | null | undefined) {
  const trimmed = (value ?? '').trim()
  return trimmed.length ? trimmed : null
}

function parseJsonObject(
  raw: string | null | undefined,
  fieldName: string,
): { value: Record<string, unknown> | null; error?: string } {
  const normalized = asNullIfEmpty(raw)
  if (!normalized) return { value: null }

  let parsed: unknown
  try {
    parsed = JSON.parse(normalized)
  } catch {
    return { value: null, error: `${fieldName} 不是合法 JSON` }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { value: null, error: `${fieldName} 必须是 JSON 对象` }
  }

  return { value: parsed as Record<string, unknown> }
}

function parseJsonStringRecord(
  raw: string | null | undefined,
  fieldName: string
): { value: Record<string, string> | null; error?: string } {
  const result = parseJsonObject(raw, fieldName)
  if (result.error) return { value: null, error: result.error }
  if (!result.value) return { value: null }

  for (const [key, value] of Object.entries(result.value)) {
    if (typeof key !== 'string') return { value: null, error: `${fieldName} key 必须是字符串` }
    if (typeof value !== 'string') return { value: null, error: `${fieldName}.${key} 必须是字符串` }
  }

  return { value: result.value as Record<string, string> }
}

function isProviderType(value: string): value is ProviderType {
  return (providerTypes as readonly string[]).includes(value)
}

function isCreatableProviderType(value: string) {
  return (creatableProviderTypes as readonly string[]).includes(value)
}

function validateEndpoint(endpoint: string) {
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    return 'endpoint 必须是完整 URL'
  }
  if (!url.protocol.startsWith('http')) return 'endpoint 必须是 http/https'
  if (!url.pathname || url.pathname === '/') {
    return 'endpoint 必须包含完整路径（不能只有域名）'
  }
  return null
}

export async function createCheckConfigAction(payload: {
  name: string
  type: string
  model: string
  endpoint: string
  apiKey: string
  enabled: boolean
  isMaintenance: boolean
  requestHeaderJson: string
  metadataJson: string
  groupName: string
}): Promise<ActionResult> {
  await requireSignedInUser()

  const name = asNullIfEmpty(payload.name)
  if (!name) return { ok: false, error: 'name 不能为空' }

  const type = asNullIfEmpty(payload.type)
  if (!type) return { ok: false, error: 'type 不能为空' }
  if (!isCreatableProviderType(type)) {
    return { ok: false, error: `type 不支持：${type}` }
  }

  const model = asNullIfEmpty(payload.model)
  if (!model) return { ok: false, error: 'model 不能为空' }

  const endpoint = asNullIfEmpty(payload.endpoint)
  if (!endpoint) return { ok: false, error: 'endpoint 不能为空' }
  const endpointError = validateEndpoint(endpoint)
  if (endpointError) return { ok: false, error: endpointError }

  const apiKey = asNullIfEmpty(payload.apiKey)
  if (!apiKey) return { ok: false, error: 'api_key 不能为空' }

  const requestHeader = parseJsonStringRecord(payload.requestHeaderJson, 'request_header')
  if (requestHeader.error) return { ok: false, error: requestHeader.error }

  const metadata = parseJsonObject(payload.metadataJson, 'metadata')
  if (metadata.error) return { ok: false, error: metadata.error }

  const groupName = asNullIfEmpty(payload.groupName)

  const admin = createAdminClient()
  const { error } = await admin.from('check_configs').insert({
    name,
    type,
    model,
    endpoint,
    api_key: apiKey,
    enabled: payload.enabled,
    is_maintenance: payload.isMaintenance,
    request_header: requestHeader.value,
    metadata: metadata.value,
    group_name: groupName,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/protected/configs')
  return { ok: true }
}

export async function updateCheckConfigAction(payload: {
  id: string
  name: string
  type: string
  model: string
  endpoint: string
  updateApiKey: boolean
  apiKey: string
  enabled: boolean
  isMaintenance: boolean
  requestHeaderJson: string
  metadataJson: string
  groupName: string
}): Promise<ActionResult> {
  await requireSignedInUser()

  const id = asNullIfEmpty(payload.id)
  if (!id) return { ok: false, error: '缺少 id' }

  const name = asNullIfEmpty(payload.name)
  if (!name) return { ok: false, error: 'name 不能为空' }

  const type = asNullIfEmpty(payload.type)
  if (!type) return { ok: false, error: 'type 不能为空' }
  if (!isProviderType(type)) {
    // 不破坏历史数据：允许“原样保存”未知 type，但禁止把它改成新的未知值。
    const admin = createAdminClient()
    const { data, error } = await admin.from('check_configs').select('type').eq('id', id).maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!data) return { ok: false, error: '配置不存在' }
    if (data.type !== type) return { ok: false, error: `type 不支持：${type}` }
  }

  const model = asNullIfEmpty(payload.model)
  if (!model) return { ok: false, error: 'model 不能为空' }

  const endpoint = asNullIfEmpty(payload.endpoint)
  if (!endpoint) return { ok: false, error: 'endpoint 不能为空' }
  const endpointError = validateEndpoint(endpoint)
  if (endpointError) return { ok: false, error: endpointError }

  const requestHeader = parseJsonStringRecord(payload.requestHeaderJson, 'request_header')
  if (requestHeader.error) return { ok: false, error: requestHeader.error }

  const metadata = parseJsonObject(payload.metadataJson, 'metadata')
  if (metadata.error) return { ok: false, error: metadata.error }

  const groupName = asNullIfEmpty(payload.groupName)

  const patch: Record<string, unknown> = {
    name,
    type,
    model,
    endpoint,
    enabled: payload.enabled,
    is_maintenance: payload.isMaintenance,
    request_header: requestHeader.value,
    metadata: metadata.value,
    group_name: groupName,
  }

  if (payload.updateApiKey) {
    const apiKey = asNullIfEmpty(payload.apiKey)
    if (!apiKey) return { ok: false, error: '选择更新 api_key 时，api_key 不能为空' }
    patch.api_key = apiKey
  }

  const admin = createAdminClient()
  const { error } = await admin.from('check_configs').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/protected/configs')
  return { ok: true }
}

export async function copyCheckConfigAction(payload: {
  sourceId: string
  name: string
  type: string
  model: string
  endpoint: string
  updateApiKey: boolean
  apiKey: string
  enabled: boolean
  isMaintenance: boolean
  requestHeaderJson: string
  metadataJson: string
  groupName: string
}): Promise<ActionResult> {
  await requireSignedInUser()

  const sourceId = asNullIfEmpty(payload.sourceId)
  if (!sourceId) return { ok: false, error: '缺少 sourceId' }

  const name = asNullIfEmpty(payload.name)
  if (!name) return { ok: false, error: 'name 不能为空' }

  const type = asNullIfEmpty(payload.type)
  if (!type) return { ok: false, error: 'type 不能为空' }
  if (!isProviderType(type)) {
    return { ok: false, error: `type 不支持：${type}` }
  }

  const model = asNullIfEmpty(payload.model)
  if (!model) return { ok: false, error: 'model 不能为空' }

  const endpoint = asNullIfEmpty(payload.endpoint)
  if (!endpoint) return { ok: false, error: 'endpoint 不能为空' }
  const endpointError = validateEndpoint(endpoint)
  if (endpointError) return { ok: false, error: endpointError }

  const requestHeader = parseJsonStringRecord(payload.requestHeaderJson, 'request_header')
  if (requestHeader.error) return { ok: false, error: requestHeader.error }

  const metadata = parseJsonObject(payload.metadataJson, 'metadata')
  if (metadata.error) return { ok: false, error: metadata.error }

  const groupName = asNullIfEmpty(payload.groupName)

  const admin = createAdminClient()

  let apiKey: string | null = null
  if (payload.updateApiKey) {
    apiKey = asNullIfEmpty(payload.apiKey)
    if (!apiKey) return { ok: false, error: '选择更新 api_key 时，api_key 不能为空' }
  } else {
    const { data, error } = await admin.from('check_configs').select('api_key').eq('id', sourceId).maybeSingle()
    if (error) return { ok: false, error: error.message }
    apiKey = (data as { api_key?: string | null } | null)?.api_key ?? null
    if (!apiKey) return { ok: false, error: '源配置缺少 api_key，无法沿用；请勾选“更新 API Key”' }
  }

  const { error: insertError } = await admin.from('check_configs').insert({
    name,
    type,
    model,
    endpoint,
    api_key: apiKey,
    enabled: payload.enabled,
    is_maintenance: payload.isMaintenance,
    request_header: requestHeader.value,
    metadata: metadata.value,
    group_name: groupName,
  })

  if (insertError) return { ok: false, error: insertError.message }

  revalidatePath('/protected/configs')
  return { ok: true }
}

export async function deleteCheckConfigAction(id: string): Promise<ActionResult> {
  await requireSignedInUser()

  const normalized = asNullIfEmpty(id)
  if (!normalized) return { ok: false, error: '缺少 id' }

  const admin = createAdminClient()
  const { error } = await admin.from('check_configs').delete().eq('id', normalized)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/protected/configs')
  return { ok: true }
}

export async function setEnabledAction(id: string, enabled: boolean): Promise<ActionResult> {
  await requireSignedInUser()

  const normalized = asNullIfEmpty(id)
  if (!normalized) return { ok: false, error: '缺少 id' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('check_configs')
    .update({ enabled })
    .eq('id', normalized)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/protected/configs')
  return { ok: true }
}

export async function setMaintenanceAction(
  id: string,
  isMaintenance: boolean
): Promise<ActionResult> {
  await requireSignedInUser()

  const normalized = asNullIfEmpty(id)
  if (!normalized) return { ok: false, error: '缺少 id' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('check_configs')
    .update({ is_maintenance: isMaintenance })
    .eq('id', normalized)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/protected/configs')
  return { ok: true }
}
