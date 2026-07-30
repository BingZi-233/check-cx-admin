"use server"

import { revalidatePath } from "next/cache"

import {
  actionSuccess,
  toActionError,
  ValidationError,
  type ActionState,
} from "@/lib/admin/action-result"
import { requireAdminUser } from "@/lib/admin/auth"
import { optionalString, parseProviderType, requiredString } from "@/lib/admin/forms"
import { createAdminClient } from "@/lib/admin/supabase-admin"

function revalidateModelPaths() {
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/models")
  revalidatePath("/dashboard/configs")
  revalidatePath("/dashboard/templates")
}

async function parseModelPayload(formData: FormData) {
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
      throw new ValidationError("template_id", "所选模板不存在")
    }

    if (template.type !== type) {
      throw new ValidationError("template_id", "模板类型和模型类型不一致")
    }
  }

  return {
    type,
    model: requiredString(formData, "model", "模型名称"),
    template_id: templateId,
  }
}

export async function createModelAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminUser()

  try {
    const payload = await parseModelPayload(formData)
    const client = createAdminClient()
    const { error } = await client.from("check_models").insert(payload)

    if (error) {
      throw error
    }
  } catch (error) {
    return toActionError(error, "创建模型失败")
  }

  revalidateModelPaths()

  return actionSuccess("模型已创建", "/dashboard/models")
}

export async function updateModelAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminUser()

  try {
    const id = requiredString(formData, "id", "模型 ID")
    const payload = await parseModelPayload(formData)
    const client = createAdminClient()
    const { error } = await client.from("check_models").update(payload).eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    return toActionError(error, "更新模型失败")
  }

  revalidateModelPaths()

  return actionSuccess("模型已更新")
}

export async function deleteModelAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminUser()

  try {
    const id = requiredString(formData, "id", "模型 ID")
    const client = createAdminClient()
    const { count, error: countError } = await client
      .from("check_configs")
      .select("id", { count: "exact", head: true })
      .eq("model_id", id)

    if (countError) {
      throw countError
    }

    if ((count ?? 0) > 0) {
      throw new Error("该模型仍被配置引用，不能删除")
    }

    const { error } = await client.from("check_models").delete().eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    return toActionError(error, "删除模型失败")
  }

  revalidateModelPaths()

  return actionSuccess("模型已删除", "/dashboard/models")
}

export async function cleanupUnusedModelsAction(
  _prevState: ActionState
): Promise<ActionState> {
  await requireAdminUser()

  let successMessage = ""

  try {
    const client = createAdminClient()
    const [{ data: models, error: modelsError }, usedConfigs] = await Promise.all([
      client.from("check_models").select("id"),
      client.from("check_configs").select("model_id"),
    ])

    if (modelsError) {
      throw modelsError
    }

    if (usedConfigs.error) {
      throw usedConfigs.error
    }

    const usedModelIds = new Set(
      (usedConfigs.data ?? [])
        .map((item) => item.model_id)
        .filter(Boolean)
    )

    const unusedModelIds = (models ?? [])
      .map((item) => item.id)
      .filter((id) => !usedModelIds.has(id))

    if (unusedModelIds.length === 0) {
      successMessage = "没有可清理的未引用模型"
    } else {
      const { error } = await client
        .from("check_models")
        .delete()
        .in("id", unusedModelIds)

      if (error) {
        throw error
      }

      successMessage = `已清理 ${unusedModelIds.length} 条未引用模型`
    }
  } catch (error) {
    return toActionError(error, "清理未引用模型失败")
  }

  revalidateModelPaths()

  return actionSuccess(successMessage)
}
