"use server"

import { revalidatePath } from "next/cache"

import {
  actionSuccess,
  toActionError,
  type ActionState,
} from "@/lib/admin/action-result"
import { requireAdminUser } from "@/lib/admin/auth"
import { parseProviderType, requiredString } from "@/lib/admin/forms"
import { parseOptionalJson } from "@/lib/admin/json"
import { createAdminClient } from "@/lib/admin/supabase-admin"

function revalidateTemplatePaths() {
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/templates")
  revalidatePath("/dashboard/models")
}

function parseTemplatePayload(formData: FormData) {
  return {
    name: requiredString(formData, "name", "模板名称"),
    type: parseProviderType(requiredString(formData, "type", "Provider 类型")),
    request_header: parseOptionalJson(formData.get("request_header"), "请求头 JSON"),
    metadata: parseOptionalJson(formData.get("metadata"), "metadata JSON"),
  }
}

export async function createTemplateAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminUser()

  try {
    const payload = parseTemplatePayload(formData)
    const client = createAdminClient()
    const { error } = await client.from("check_request_templates").insert(payload)

    if (error) {
      throw error
    }
  } catch (error) {
    return toActionError(error, "创建模板失败")
  }

  revalidateTemplatePaths()

  return actionSuccess("模板已创建", "/dashboard/templates")
}

export async function updateTemplateAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminUser()

  try {
    const id = requiredString(formData, "id", "模板 ID")
    const payload = parseTemplatePayload(formData)
    const client = createAdminClient()
    const { error } = await client
      .from("check_request_templates")
      .update(payload)
      .eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    return toActionError(error, "更新模板失败")
  }

  revalidateTemplatePaths()

  return actionSuccess("模板已更新")
}

export async function deleteTemplateAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminUser()

  try {
    const id = requiredString(formData, "id", "模板 ID")
    const client = createAdminClient()
    const { count, error: countError } = await client
      .from("check_models")
      .select("id", { count: "exact", head: true })
      .eq("template_id", id)

    if (countError) {
      throw countError
    }

    if ((count ?? 0) > 0) {
      throw new Error("该模板仍被模型引用，不能删除")
    }

    const { error } = await client
      .from("check_request_templates")
      .delete()
      .eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    return toActionError(error, "删除模板失败")
  }

  revalidateTemplatePaths()

  return actionSuccess("模板已删除", "/dashboard/templates")
}

export async function cleanupUnusedTemplatesAction(
  _prevState: ActionState
): Promise<ActionState> {
  await requireAdminUser()

  let successMessage = ""

  try {
    const client = createAdminClient()
    const [{ data: templates, error: templatesError }, usedModels] = await Promise.all([
      client.from("check_request_templates").select("id"),
      client.from("check_models").select("template_id"),
    ])

    if (templatesError) {
      throw templatesError
    }

    if (usedModels.error) {
      throw usedModels.error
    }

    const usedTemplateIds = new Set(
      (usedModels.data ?? [])
        .map((item) => item.template_id)
        .filter(Boolean)
    )

    const unusedTemplateIds = (templates ?? [])
      .map((item) => item.id)
      .filter((id) => !usedTemplateIds.has(id))

    if (unusedTemplateIds.length === 0) {
      successMessage = "没有可清理的未引用模板"
    } else {
      const { error } = await client
        .from("check_request_templates")
        .delete()
        .in("id", unusedTemplateIds)

      if (error) {
        throw error
      }

      successMessage = `已清理 ${unusedTemplateIds.length} 条未引用模板`
    }
  } catch (error) {
    return toActionError(error, "清理未引用模板失败")
  }

  revalidateTemplatePaths()

  return actionSuccess(successMessage)
}
