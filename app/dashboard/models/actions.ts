"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdminUser } from "@/lib/admin/auth"
import { optionalString, parseProviderType, requiredString, withMessage } from "@/lib/admin/forms"
import { createAdminClient } from "@/lib/admin/supabase-admin"

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim().length > 0
  ) {
    return error.message
  }

  return fallback
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
      throw new Error("所选模板不存在")
    }

    if (template.type !== type) {
      throw new Error("模板类型和模型类型不一致")
    }
  }

  return {
    type,
    model: requiredString(formData, "model", "模型名称"),
    template_id: templateId,
  }
}

export async function createModelAction(formData: FormData) {
  await requireAdminUser()

  try {
    const payload = await parseModelPayload(formData)
    const client = createAdminClient()
    const { error } = await client.from("check_models").insert(payload)

    if (error) {
      throw error
    }
  } catch (error) {
    const message = getActionErrorMessage(error, "创建模型失败")
    redirect(withMessage("/dashboard/models/new", "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/models")
  revalidatePath("/dashboard/configs")
  revalidatePath("/dashboard/templates")
  redirect(withMessage("/dashboard/models", "success", "模型已创建"))
}

export async function updateModelAction(formData: FormData) {
  await requireAdminUser()

  const id = requiredString(formData, "id", "模型 ID")

  try {
    const payload = await parseModelPayload(formData)
    const client = createAdminClient()
    const { error } = await client.from("check_models").update(payload).eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    const message = getActionErrorMessage(error, "更新模型失败")
    redirect(withMessage(`/dashboard/models/${id}`, "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/models")
  revalidatePath("/dashboard/configs")
  revalidatePath("/dashboard/templates")
  redirect(withMessage(`/dashboard/models/${id}`, "success", "模型已更新"))
}

export async function deleteModelAction(formData: FormData) {
  await requireAdminUser()

  const id = requiredString(formData, "id", "模型 ID")

  try {
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
    const message = getActionErrorMessage(error, "删除模型失败")
    redirect(withMessage(`/dashboard/models/${id}`, "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/models")
  revalidatePath("/dashboard/configs")
  revalidatePath("/dashboard/templates")
  redirect(withMessage("/dashboard/models", "success", "模型已删除"))
}

export async function cleanupUnusedModelsAction() {
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
      const { error } = await client.from("check_models").delete().in("id", unusedModelIds)

      if (error) {
        throw error
      }

      successMessage = `已清理 ${unusedModelIds.length} 条未引用模型`
    }
  } catch (error) {
    const message = getActionErrorMessage(error, "清理未引用模型失败")
    redirect(withMessage("/dashboard/models", "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/models")
  revalidatePath("/dashboard/configs")
  revalidatePath("/dashboard/templates")
  redirect(withMessage("/dashboard/models", "success", successMessage))
}
