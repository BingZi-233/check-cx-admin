"use server"

import { revalidatePath } from "next/cache"

import { normalizeUiErrorMessage } from "@/lib/locale"
import { createClient } from "@/lib/supabase/server"

type GroupActionState = {
  ok: boolean
  message?: string
  fieldErrors?: Partial<Record<"group_name" | "website_url", string>>
}

const initialState: GroupActionState = { ok: false }

function parseGroupName(value: unknown) {
  const groupName = String(value ?? "").trim()
  if (!groupName) return { ok: false as const, error: "分组名称不能为空" }
  if (groupName.length > 80) return { ok: false as const, error: "分组名称太长（最多80字符）" }
  return { ok: true as const, value: groupName }
}

function parseWebsiteUrl(value: unknown) {
  const websiteUrl = String(value ?? "").trim()
  if (!websiteUrl) return { ok: false as const, error: "官网URL不能为空" }
  try {
    const url = new URL(websiteUrl)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false as const, error: "官网URL必须以 http:// 或 https:// 开头" }
    }
  } catch {
    return { ok: false as const, error: "官网URL不是合法URL" }
  }
  return { ok: true as const, value: websiteUrl }
}

function normalizeSupabaseErrorMessage(message?: string) {
  if (!message) return "请求失败"
  const lower = message.toLowerCase()
  if (lower.includes("duplicate")) return "分组名称已存在"
  if (lower.includes("unique")) return "分组名称已存在"
  return normalizeUiErrorMessage(message, "请求失败")
}

async function requireAuth() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) return { ok: false as const, state: { ok: false, message: "未登录" } }
  return { ok: true as const, supabase }
}

export async function createGroupAction(
  _prevState: GroupActionState,
  formData: FormData
): Promise<GroupActionState> {
  const auth = await requireAuth()
  if (!auth.ok) return auth.state

  const parsedName = parseGroupName(formData.get("group_name"))
  const parsedUrl = parseWebsiteUrl(formData.get("website_url"))
  const fieldErrors: GroupActionState["fieldErrors"] = {}
  if (!parsedName.ok) fieldErrors.group_name = parsedName.error
  if (!parsedUrl.ok) fieldErrors.website_url = parsedUrl.error
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors }

  const { error } = await auth.supabase
    .from("group_info")
    .insert({ group_name: parsedName.value, website_url: parsedUrl.value })

  if (error) {
    return { ok: false, message: normalizeSupabaseErrorMessage(error.message) }
  }

  revalidatePath("/protected/groups")
  return { ok: true, message: "已创建" }
}

export async function updateGroupAction(
  _prevState: GroupActionState,
  formData: FormData
): Promise<GroupActionState> {
  const auth = await requireAuth()
  if (!auth.ok) return auth.state

  const id = String(formData.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "缺少分组ID" }

  const parsedName = parseGroupName(formData.get("group_name"))
  const parsedUrl = parseWebsiteUrl(formData.get("website_url"))
  const fieldErrors: GroupActionState["fieldErrors"] = {}
  if (!parsedName.ok) fieldErrors.group_name = parsedName.error
  if (!parsedUrl.ok) fieldErrors.website_url = parsedUrl.error
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors }

  const { error } = await auth.supabase
    .from("group_info")
    .update({
      group_name: parsedName.value,
      website_url: parsedUrl.value,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    return { ok: false, message: normalizeSupabaseErrorMessage(error.message) }
  }

  revalidatePath("/protected/groups")
  return { ok: true, message: "已保存" }
}

export async function deleteGroupAction(
  _prevState: GroupActionState,
  formData: FormData
): Promise<GroupActionState> {
  const auth = await requireAuth()
  if (!auth.ok) return auth.state

  const id = String(formData.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "缺少分组ID" }

  const { error } = await auth.supabase.from("group_info").delete().eq("id", id)
  if (error) {
    return { ok: false, message: normalizeSupabaseErrorMessage(error.message) }
  }

  revalidatePath("/protected/groups")
  return { ok: true, message: "已删除" }
}

export { initialState, type GroupActionState }
