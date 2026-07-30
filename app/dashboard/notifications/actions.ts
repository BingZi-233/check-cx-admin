"use server"

import { revalidatePath } from "next/cache"

import {
  actionSuccess,
  toActionError,
  type ActionState,
} from "@/lib/admin/action-result"
import { requireAdminUser } from "@/lib/admin/auth"
import {
  booleanFromForm,
  parseNotificationLevel,
  requiredString,
} from "@/lib/admin/forms"
import { createAdminClient } from "@/lib/admin/supabase-admin"

function revalidateNotificationPaths(id?: string) {
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/notifications")

  if (id) {
    revalidatePath(`/dashboard/notifications/${id}`)
  }
}

function getPayload(formData: FormData) {
  return {
    message: requiredString(formData, "message", "通知内容"),
    level: parseNotificationLevel(requiredString(formData, "level", "通知级别")),
    is_active: booleanFromForm(formData, "is_active"),
  }
}

export async function createNotificationAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminUser()

  try {
    const client = createAdminClient()
    const { error } = await client
      .from("system_notifications")
      .insert(getPayload(formData))

    if (error) {
      throw error
    }
  } catch (error) {
    return toActionError(error, "创建通知失败")
  }

  revalidateNotificationPaths()

  return actionSuccess("系统通知已创建", "/dashboard/notifications")
}

export async function updateNotificationAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminUser()

  try {
    const id = requiredString(formData, "id", "通知 ID")
    const client = createAdminClient()
    const { error } = await client
      .from("system_notifications")
      .update(getPayload(formData))
      .eq("id", id)

    if (error) {
      throw error
    }

    revalidateNotificationPaths(id)

    return actionSuccess("系统通知已更新")
  } catch (error) {
    return toActionError(error, "更新通知失败")
  }
}

export async function toggleNotificationActiveAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminUser()

  try {
    const id = requiredString(formData, "id", "通知 ID")
    const isActive = booleanFromForm(formData, "is_active")
    const client = createAdminClient()
    const { error } = await client
      .from("system_notifications")
      .update({ is_active: isActive })
      .eq("id", id)

    if (error) {
      throw error
    }

    revalidateNotificationPaths(id)

    return actionSuccess(isActive ? "系统通知已显示" : "系统通知已隐藏")
  } catch (error) {
    return toActionError(error, "切换通知状态失败")
  }
}

export async function deleteNotificationAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminUser()

  try {
    const id = requiredString(formData, "id", "通知 ID")
    const client = createAdminClient()
    const { error } = await client
      .from("system_notifications")
      .delete()
      .eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    return toActionError(error, "删除通知失败")
  }

  revalidateNotificationPaths()

  return actionSuccess("系统通知已删除", "/dashboard/notifications")
}
