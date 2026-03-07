"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdminUser } from "@/lib/admin/auth"
import { requiredString, optionalString, booleanFromForm, parseProviderType, withMessage } from "@/lib/admin/forms"
import { parseOptionalJson } from "@/lib/admin/json"
import { createAdminClient } from "@/lib/admin/supabase-admin"

async function parseConfigPayload(formData: FormData) {
  const client = createAdminClient()
  const type = parseProviderType(requiredString(formData, "type", "Provider 类型"))
  const templateId = optionalString(formData, "template_id")

  if (templateId) {
    const { data: template, error } = await client
      .from("check_request_templates")
      .select("id, type")
      .eq("id", templateId)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!template) {
      throw new Error("所选模板不存在")
    }

    if (template.type !== type) {
      throw new Error("模板类型和配置类型不一致")
    }
  }

  return {
    name: requiredString(formData, "name", "显示名称"),
    type,
    model: requiredString(formData, "model", "模型名称"),
    endpoint: requiredString(formData, "endpoint", "API 端点"),
    api_key: requiredString(formData, "api_key", "API Key"),
    enabled: booleanFromForm(formData, "enabled"),
    is_maintenance: booleanFromForm(formData, "is_maintenance"),
    template_id: templateId,
    request_header: parseOptionalJson(formData.get("request_header"), "请求头 JSON"),
    group_name: optionalString(formData, "group_name"),
    metadata: parseOptionalJson(formData.get("metadata"), "metadata JSON"),
  }
}

export async function createConfigAction(formData: FormData) {
  await requireAdminUser()

  try {
    const payload = await parseConfigPayload(formData)
    const client = createAdminClient()
    const { error } = await client.from("check_configs").insert(payload)

    if (error) {
      throw error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建配置失败"
    redirect(withMessage("/dashboard/configs/new", "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/configs")
  redirect(withMessage("/dashboard/configs", "success", "配置已创建"))
}

export async function updateConfigAction(formData: FormData) {
  await requireAdminUser()

  const id = requiredString(formData, "id", "配置 ID")

  try {
    const payload = await parseConfigPayload(formData)
    const client = createAdminClient()
    const { error } = await client.from("check_configs").update(payload).eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新配置失败"
    redirect(withMessage(`/dashboard/configs/${id}`, "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/configs")
  redirect(withMessage(`/dashboard/configs/${id}`, "success", "配置已更新"))
}

export async function deleteConfigAction(formData: FormData) {
  await requireAdminUser()

  const id = requiredString(formData, "id", "配置 ID")

  try {
    const client = createAdminClient()
    const { error } = await client.from("check_configs").delete().eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除配置失败"
    redirect(withMessage(`/dashboard/configs/${id}`, "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/configs")
  redirect(withMessage("/dashboard/configs", "success", "配置已删除"))
}
