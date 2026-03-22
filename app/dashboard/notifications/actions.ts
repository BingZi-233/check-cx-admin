"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdminUser } from "@/lib/admin/auth"
import {
  booleanFromForm,
  optionalString,
  parseNotificationLevel,
  requiredString,
  withMessage,
} from "@/lib/admin/forms"
import { createAdminClient } from "@/lib/admin/supabase-admin"

function getPayload(formData: FormData) {
  return {
    message: requiredString(formData, "message", "通知内容"),
    level: parseNotificationLevel(requiredString(formData, "level", "通知级别")),
    is_active: booleanFromForm(formData, "is_active"),
  }
}

export async function createNotificationAction(formData: FormData) {
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
    const message = error instanceof Error ? error.message : "创建通知失败"
    redirect(withMessage("/dashboard/notifications/new", "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/notifications")
  redirect(withMessage("/dashboard/notifications", "success", "系统通知已创建"))
}

export async function updateNotificationAction(formData: FormData) {
  await requireAdminUser()

  const id = requiredString(formData, "id", "通知 ID")

  try {
    const client = createAdminClient()
    const { error } = await client
      .from("system_notifications")
      .update(getPayload(formData))
      .eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新通知失败"
    redirect(withMessage(`/dashboard/notifications/${id}`, "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/notifications")
  revalidatePath(`/dashboard/notifications/${id}`)
  redirect(withMessage(`/dashboard/notifications/${id}`, "success", "系统通知已更新"))
}

export async function toggleNotificationActiveAction(formData: FormData) {
  await requireAdminUser()

  const id = requiredString(formData, "id", "通知 ID")
  const isActive = booleanFromForm(formData, "is_active")
  const returnTo = optionalString(formData, "return_to")

  try {
    const client = createAdminClient()
    const { error } = await client
      .from("system_notifications")
      .update({ is_active: isActive })
      .eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "切换通知状态失败"
    const fallbackPath = returnTo?.startsWith("/dashboard/notifications")
      ? returnTo
      : "/dashboard/notifications"

    redirect(withMessage(fallbackPath, "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/notifications")
  revalidatePath(`/dashboard/notifications/${id}`)

  const fallbackPath = returnTo?.startsWith("/dashboard/notifications")
    ? returnTo
    : "/dashboard/notifications"
  const message = isActive ? "系统通知已显示" : "系统通知已隐藏"

  redirect(withMessage(fallbackPath, "success", message))
}

export async function deleteNotificationAction(formData: FormData) {
  await requireAdminUser()

  const id = requiredString(formData, "id", "通知 ID")

  try {
    const client = createAdminClient()
    const { error } = await client
      .from("system_notifications")
      .delete()
      .eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除通知失败"
    redirect(withMessage(`/dashboard/notifications/${id}`, "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/notifications")
  redirect(withMessage("/dashboard/notifications", "success", "系统通知已删除"))
}
