import "server-only"

import { getAuthEnv } from "@/lib/admin/env"

function readServerEnv(name: string) {
  return process.env[name]?.trim() ?? ""
}

function normalizeSchemaName(value: string) {
  const schema = value.trim()

  if (!schema) {
    return "public"
  }

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
    throw new Error("SUPABASE_DB_SCHEMA 非法，只允许字母、数字和下划线，且不能以数字开头")
  }

  return schema
}

export function getServerEnv() {
  const authEnv = getAuthEnv()

  return {
    supabaseUrl: authEnv.supabaseUrl,
    publicSupabaseKey: authEnv.supabaseKey,
    serviceRoleKey: readServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    dbSchema: normalizeSchemaName(readServerEnv("SUPABASE_DB_SCHEMA")),
    adminEmails: readServerEnv("ADMIN_EMAILS")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  }
}

export function getServerSupabaseUrl() {
  return getServerEnv().supabaseUrl
}

export function getServerSupabasePublicKey() {
  return getServerEnv().publicSupabaseKey
}

export function getServiceRoleKey() {
  return getServerEnv().serviceRoleKey
}

export function getAdminDatabaseSchema() {
  return getServerEnv().dbSchema
}

export function hasAdminDatabaseEnv() {
  try {
    const env = getServerEnv()
    return Boolean(env.supabaseUrl && env.serviceRoleKey)
  } catch {
    return false
  }
}

export function getAdminDatabaseWarnings() {
  const warnings: string[] = []
  let env: ReturnType<typeof getServerEnv> | null = null

  try {
    env = getServerEnv()
  } catch (error) {
    const message = error instanceof Error ? error.message : "SUPABASE_DB_SCHEMA 配置非法"
    warnings.push(message)
    return warnings
  }

  if (!env.supabaseUrl) {
    warnings.push("缺少 SUPABASE_URL")
  }

  if (!env.serviceRoleKey) {
    warnings.push("缺少 SUPABASE_SERVICE_ROLE_KEY，后台无法读写受保护表")
  }

  return warnings
}

export function getAdminEmails() {
  return getServerEnv().adminEmails
}

export function isAllowedAdminEmail(email?: string | null) {
  const admins = getAdminEmails()

  if (admins.length === 0) {
    return true
  }

  return admins.includes((email ?? "").toLowerCase())
}
