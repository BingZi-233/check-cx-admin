import "server-only"

import { getPublicSupabaseUrl } from "@/lib/admin/env"

export function getServerSupabaseUrl() {
  return getPublicSupabaseUrl() || process.env.SUPABASE_URL?.trim() || ""
}

export function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? ""
}

export function hasAdminDatabaseEnv() {
  return Boolean(getServerSupabaseUrl() && getServiceRoleKey())
}

export function getAdminDatabaseWarnings() {
  const warnings: string[] = []

  if (!getServerSupabaseUrl()) {
    warnings.push("缺少 Supabase URL")
  }

  if (!getServiceRoleKey()) {
    warnings.push("缺少 SUPABASE_SERVICE_ROLE_KEY，后台无法读写受保护表")
  }

  return warnings
}

export function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS?.trim()

  if (!raw) {
    return []
  }

  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

export function isAllowedAdminEmail(email?: string | null) {
  const admins = getAdminEmails()

  if (admins.length === 0) {
    return true
  }

  return admins.includes((email ?? "").toLowerCase())
}
