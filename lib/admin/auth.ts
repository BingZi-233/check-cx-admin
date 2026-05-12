import "server-only"

import { redirect } from "next/navigation"

import { hasSupabaseAuthEnv } from "@/lib/admin/env"
import { hasAdminDatabaseEnv, isAllowedAdminEmail } from "@/lib/admin/server-env"
import { AdminDirectoryUserRecord, AdminUser, AppUser } from "@/lib/admin/types"
import { createAdminClient } from "@/lib/admin/supabase-admin"
import { createClient } from "@/lib/supabase/server"

function toAdminUser(user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}) {
  const email = user.email ?? ""
  const nameFromMetadata =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : ""

  const displayName = nameFromMetadata || email.split("@")[0] || "管理员"

  return {
    id: user.id,
    email,
    displayName,
    avatarUrl:
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : null,
  } satisfies AdminUser
}

type AuthIdentity = {
  id: string
  email?: string | null
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}

function normalizeEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase()
}

function isGitHubIdentity(user: AuthIdentity) {
  const provider =
    typeof user.app_metadata?.provider === "string"
      ? user.app_metadata.provider
      : ""
  const providers = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers.filter((item): item is string => typeof item === "string")
    : []

  return provider === "github" || providers.includes("github")
}

async function updateDirectoryActivation(id: string, authUserId: string, activatedAt: string | null) {
  const payload: Partial<AdminDirectoryUserRecord> = {}

  if (authUserId) {
    payload.auth_user_id = authUserId
  }

  if (!activatedAt) {
    payload.activated_at = new Date().toISOString()
  }

  if (Object.keys(payload).length === 0) {
    return
  }

  const client = createAdminClient()
  const { error } = await client.from("admin_users").update(payload).eq("id", id)

  if (error) {
    throw error
  }
}

export async function resolveAppUserFromIdentity(user: AuthIdentity): Promise<AppUser | null> {
  const base = toAdminUser(user)
  const email = normalizeEmail(user.email)

  if (!email || !isGitHubIdentity(user)) {
    return null
  }

  if (isAllowedAdminEmail(email)) {
    return {
      ...base,
      role: "admin",
      groupName: null,
      directoryUserId: null,
      isBootstrapAdmin: true,
    }
  }

  if (!hasAdminDatabaseEnv()) {
    return null
  }

  const client = createAdminClient()
  const { data, error } = await client
    .from("admin_users")
    .select("id, email, role, group_name, auth_user_id, invited_by, is_active, invited_at, activated_at, created_at, updated_at")
    .eq("email", email)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data || data.is_active === false) {
    return null
  }

  const groupName = data.group_name?.trim() || null

  if (data.role === "member" && !groupName) {
    return null
  }

  await updateDirectoryActivation(data.id, user.id, data.activated_at)

  return {
    ...base,
    role: data.role,
    groupName,
    directoryUserId: data.id,
    isBootstrapAdmin: false,
  }
}

export async function getOptionalAppUser() {
  if (!hasSupabaseAuthEnv()) {
    return null
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return resolveAppUserFromIdentity(user)
}

export async function requireAppUser() {
  const user = await getOptionalAppUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

export async function getOptionalAdminUser() {
  const user = await getOptionalAppUser()

  if (!user || user.role !== "admin") {
    return null
  }

  return user
}

export async function requireAdminUser() {
  const user = await getOptionalAdminUser()

  if (!user) {
    redirect("/login")
  }

  return user
}
