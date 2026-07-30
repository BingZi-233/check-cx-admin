"use server"

import { revalidatePath } from "next/cache"

import {
  actionSuccess,
  toActionError,
  ValidationError,
  type ActionState,
} from "@/lib/admin/action-result"
import { requireAdminUser } from "@/lib/admin/auth"
import { optionalString, requiredString } from "@/lib/admin/forms"
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

  throw new ValidationError("role", "用户角色非法")
}

export async function inviteAdminUserAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const currentUser = await requireAdminUser()
  const client = createAdminClient()

  try {
    const email = normalizeEmail(requiredString(formData, "email", "邮箱"))
    const role = parseUserRole(requiredString(formData, "role", "角色"))
    const groupName = normalizeGroupName(optionalString(formData, "group_name"))

    if (role === "member" && !groupName) {
      throw new ValidationError("group_name", "成员必须预设分组名称")
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
      const { error } = await client
        .from("admin_users")
        .update(payload)
        .eq("id", existing.id)

      if (error) {
        throw error
      }
    } else {
      const { error } = await client.from("admin_users").insert(payload)

      if (error) {
        throw error
      }
    }

    revalidatePath("/dashboard/users")

    return actionSuccess(
      existing
        ? "允许名单已更新；对方下次使用 GitHub 登录会按新配置生效"
        : "允许名单已写入；对方现在可以使用 GitHub 登录后台"
    )
  } catch (error) {
    return toActionError(error, "写入允许名单失败")
  }
}
