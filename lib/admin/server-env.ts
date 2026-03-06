import "server-only"

import { getAuthEnv } from "@/lib/admin/env"

function readServerEnv(name: string) {
  return process.env[name]?.trim() ?? ""
}

export function getServerEnv() {
  const authEnv = getAuthEnv()

  return {
    supabaseUrl: authEnv.supabaseUrl,
    publicSupabaseKey: authEnv.supabaseKey,
    serviceRoleKey: readServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
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

export function hasAdminDatabaseEnv() {
  const env = getServerEnv()
  return Boolean(env.supabaseUrl && env.serviceRoleKey)
}

export function getAdminDatabaseWarnings() {
  const warnings: string[] = []
  const env = getServerEnv()

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
