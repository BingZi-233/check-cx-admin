"use server"

import { revalidatePath } from "next/cache"

import {
  actionSuccess,
  toActionError,
  type ActionState,
} from "@/lib/admin/action-result"
import { requireAdminUser } from "@/lib/admin/auth"
import { optionalString, requiredString } from "@/lib/admin/forms"
import { createAdminClient } from "@/lib/admin/supabase-admin"

function revalidateGroupPaths(id?: string) {
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/groups")
  revalidatePath("/dashboard/users")

  if (id) {
    revalidatePath(`/dashboard/groups/${id}`)
  }
}

function getPayload(formData: FormData) {
  return {
    group_name: requiredString(formData, "group_name", "分组名称"),
    website_url: optionalString(formData, "website_url"),
    tags: formData.get("tags")?.toString().trim() || "",
  }
}

export async function createGroupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminUser()

  try {
    const client = createAdminClient()
    const { error } = await client.from("group_info").insert(getPayload(formData))

    if (error) {
      throw error
    }
  } catch (error) {
    return toActionError(error, "创建分组失败")
  }

  revalidateGroupPaths()

  return actionSuccess("分组已创建", "/dashboard/groups")
}

export async function updateGroupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminUser()

  try {
    const id = requiredString(formData, "id", "分组 ID")
    const client = createAdminClient()
    const { error } = await client
      .from("group_info")
      .update(getPayload(formData))
      .eq("id", id)

    if (error) {
      throw error
    }

    revalidateGroupPaths(id)

    return actionSuccess("分组已更新")
  } catch (error) {
    return toActionError(error, "更新分组失败")
  }
}

export async function deleteGroupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminUser()

  try {
    const id = requiredString(formData, "id", "分组 ID")
    const client = createAdminClient()
    const { error } = await client.from("group_info").delete().eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    return toActionError(error, "删除分组失败")
  }

  revalidateGroupPaths()

  return actionSuccess("分组已删除", "/dashboard/groups")
}
