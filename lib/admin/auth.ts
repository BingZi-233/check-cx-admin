import "server-only"

import { redirect } from "next/navigation"

import { hasSupabaseAuthEnv } from "@/lib/admin/env"
import { isAllowedAdminEmail } from "@/lib/admin/server-env"
import { AdminUser } from "@/lib/admin/types"
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

export async function getOptionalAdminUser() {
  if (!hasSupabaseAuthEnv()) {
    return null
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAllowedAdminEmail(user.email)) {
    return null
  }

  return toAdminUser(user)
}

export async function requireAdminUser() {
  const user = await getOptionalAdminUser()

  if (!user) {
    redirect("/login")
  }

  return user
}
