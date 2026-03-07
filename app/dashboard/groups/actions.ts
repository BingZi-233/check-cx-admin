"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdminUser } from "@/lib/admin/auth"
import {
  optionalString,
  requiredString,
  withMessage,
} from "@/lib/admin/forms"
import { createAdminClient } from "@/lib/admin/supabase-admin"

function getPayload(formData: FormData) {
  return {
    group_name: requiredString(formData, "group_name", "分组名称"),
    website_url: optionalString(formData, "website_url"),
    tags: formData.get("tags")?.toString().trim() || "",
  }
}

export async function createGroupAction(formData: FormData) {
  await requireAdminUser()

  try {
    const client = createAdminClient()
    const { error } = await client.from("group_info").insert(getPayload(formData))

    if (error) {
      throw error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建分组失败"
    redirect(withMessage("/dashboard/groups/new", "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/groups")
  redirect(withMessage("/dashboard/groups", "success", "分组已创建"))
}

export async function updateGroupAction(formData: FormData) {
  await requireAdminUser()

  const id = requiredString(formData, "id", "分组 ID")

  try {
    const client = createAdminClient()
    const { error } = await client
      .from("group_info")
      .update(getPayload(formData))
      .eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新分组失败"
    redirect(withMessage(`/dashboard/groups/${id}`, "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/groups")
  revalidatePath(`/dashboard/groups/${id}`)
  redirect(withMessage(`/dashboard/groups/${id}`, "success", "分组已更新"))
}

export async function deleteGroupAction(formData: FormData) {
  await requireAdminUser()

  const id = requiredString(formData, "id", "分组 ID")

  try {
    const client = createAdminClient()
    const { error } = await client.from("group_info").delete().eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除分组失败"
    redirect(withMessage(`/dashboard/groups/${id}`, "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/groups")
  redirect(withMessage("/dashboard/groups", "success", "分组已删除"))
}
