"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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
      .select("id, auth_user_id, activated_at")
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

    if (!existing?.auth_user_id && !existing?.activated_at) {
      const appUrl = getAppUrl()
      const { error: inviteError } = await client.auth.admin.inviteUserByEmail(
        email,
        appUrl
          ? {
              redirectTo: `${appUrl}/auth/callback?next=/dashboard`,
            }
          : undefined
      )

      if (inviteError) {
        const message = inviteError.message.toLowerCase()
        const isExistingUser =
          message.includes("already") && (message.includes("registered") || message.includes("exists"))

        if (!isExistingUser) {
          throw inviteError
        }

        successMessage = "用户目录已更新；该邮箱已有账号，请直接登录后台"
      } else {
        successMessage = existing ? "用户目录已更新，并重新发送邀请邮件" : "邀请已发送"
      }
    }

    revalidatePath("/dashboard/users")
    redirect(withMessage("/dashboard/users", "success", successMessage))
  } catch (error) {
    const message = error instanceof Error ? error.message : "发送邀请失败"
    redirect(withMessage("/dashboard/users", "error", message))
  }
}
