"use server"

import { revalidatePath } from "next/cache"
import { redirect, unstable_rethrow } from "next/navigation"

import { requireAdminUser } from "@/lib/admin/auth"
import { getAppUrl } from "@/lib/admin/env"
import { optionalString, requiredString, withMessage } from "@/lib/admin/forms"
import { createAdminClient } from "@/lib/admin/supabase-admin"
import { UserRole } from "@/lib/admin/types"

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function normalizeGroupName(value: string | null) {
  const groupName = value?.trim() ?? ""
  return groupName.length > 0 ? groupName : null
}

function parseUserRole(value: string): UserRole {
  if (value === "admin" || value === "member") {
    return value
  }

  throw new Error("用户角色非法")
}

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim().length > 0
  ) {
    return error.message
  }

  return fallback
}

function getInviteRedirectTo() {
  const appUrl = getAppUrl()
  return appUrl ? `${appUrl}/auth/callback?next=/dashboard` : undefined
}

function isExistingUserInviteError(message: string) {
  const normalized = message.toLowerCase()
  return normalized.includes("already") && (normalized.includes("registered") || normalized.includes("exists"))
}

async function sendInviteEmail(client: ReturnType<typeof createAdminClient>, email: string) {
  const redirectTo = getInviteRedirectTo()
  const { error } = await client.auth.admin.inviteUserByEmail(
    email,
    redirectTo
      ? {
          redirectTo,
        }
      : undefined
  )

  if (error) {
    throw error
  }
}

export async function inviteAdminUserAction(formData: FormData) {
  const currentUser = await requireAdminUser()
  const client = createAdminClient()

  try {
    const email = normalizeEmail(requiredString(formData, "email", "邮箱"))
    const role = parseUserRole(requiredString(formData, "role", "角色"))
    const groupName = normalizeGroupName(optionalString(formData, "group_name"))

    if (role === "member" && !groupName) {
      throw new Error("成员必须预设分组名称")
    }

    const { data: existing, error: existingError } = await client
      .from("admin_users")
      .select("id, activated_at")
      .eq("email", email)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    const payload = {
      email,
      role,
      group_name: role === "member" ? groupName : null,
      invited_by: currentUser.directoryUserId,
      is_active: true,
    }

    if (existing) {
      const { error } = await client.from("admin_users").update(payload).eq("id", existing.id)

      if (error) {
        throw error
      }
    } else {
      const { error } = await client.from("admin_users").insert(payload)

      if (error) {
        throw error
      }
    }

    let successMessage = existing
      ? "用户目录已更新"
      : "邀请目录已写入"

    if (!existing?.activated_at) {
      try {
        await sendInviteEmail(client, email)
        successMessage = existing ? "用户目录已更新，并重新发送邀请邮件" : "邀请已发送"
      } catch (inviteError) {
        const message = inviteError instanceof Error ? inviteError.message : "发送邀请失败"

        if (!isExistingUserInviteError(message)) {
          throw inviteError
        }

        successMessage = "用户目录已更新；该邮箱已有账号，请直接登录后台"
      }
    }

    revalidatePath("/dashboard/users")
    redirect(withMessage("/dashboard/users", "success", successMessage))
  } catch (error) {
    unstable_rethrow(error)
    const message = getActionErrorMessage(error, "发送邀请失败")
    redirect(withMessage("/dashboard/users", "error", message))
  }
}

export async function resendAdminUserInviteAction(formData: FormData) {
  await requireAdminUser()
  const client = createAdminClient()

  try {
    const id = requiredString(formData, "id", "用户 ID")

    const { data: existing, error: existingError } = await client
      .from("admin_users")
      .select("id, email, is_active, activated_at")
      .eq("id", id)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (!existing) {
      throw new Error("指定用户不存在")
    }

    if (existing.is_active === false) {
      throw new Error("该用户已停用，不能重新发送邀请")
    }

    if (existing.activated_at) {
      throw new Error("该用户已激活，无需重新发送邀请")
    }

    try {
      await sendInviteEmail(client, existing.email)
    } catch (inviteError) {
      const message = inviteError instanceof Error ? inviteError.message : "重新发送邀请失败"

      if (!isExistingUserInviteError(message)) {
        throw inviteError
      }

      throw new Error("该邮箱已有可用账号，请直接登录后台")
    }

    revalidatePath("/dashboard/users")
    redirect(withMessage("/dashboard/users", "success", `已重新发送邀请邮件到 ${existing.email}`))
  } catch (error) {
    unstable_rethrow(error)
    const message = getActionErrorMessage(error, "重新发送邀请失败")
    redirect(withMessage("/dashboard/users", "error", message))
  }
}
