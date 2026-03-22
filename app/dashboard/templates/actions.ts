"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdminUser } from "@/lib/admin/auth"
import { parseProviderType, requiredString, withMessage } from "@/lib/admin/forms"
import { parseOptionalJson } from "@/lib/admin/json"
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

async function parseTemplatePayload(formData: FormData) {
  return {
    name: requiredString(formData, "name", "模板名称"),
    type: parseProviderType(requiredString(formData, "type", "Provider 类型")),
    request_header: parseOptionalJson(formData.get("request_header"), "请求头 JSON"),
    metadata: parseOptionalJson(formData.get("metadata"), "metadata JSON"),
  }
}

export async function createTemplateAction(formData: FormData) {
  await requireAdminUser()

  try {
    const payload = await parseTemplatePayload(formData)
    const client = createAdminClient()
    const { error } = await client.from("check_request_templates").insert(payload)

    if (error) {
      throw error
    }
  } catch (error) {
    const message = getActionErrorMessage(error, "创建模板失败")
    redirect(withMessage("/dashboard/templates/new", "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/templates")
  revalidatePath("/dashboard/models")
  redirect(withMessage("/dashboard/templates", "success", "模板已创建"))
}

export async function updateTemplateAction(formData: FormData) {
  await requireAdminUser()

  const id = requiredString(formData, "id", "模板 ID")

  try {
    const payload = await parseTemplatePayload(formData)
    const client = createAdminClient()
    const { error } = await client.from("check_request_templates").update(payload).eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    const message = getActionErrorMessage(error, "更新模板失败")
    redirect(withMessage(`/dashboard/templates/${id}`, "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/templates")
  revalidatePath("/dashboard/models")
  redirect(withMessage(`/dashboard/templates/${id}`, "success", "模板已更新"))
}

export async function deleteTemplateAction(formData: FormData) {
  await requireAdminUser()

  const id = requiredString(formData, "id", "模板 ID")

  try {
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

    const { error } = await client.from("check_request_templates").delete().eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    const message = getActionErrorMessage(error, "删除模板失败")
    redirect(withMessage(`/dashboard/templates/${id}`, "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/templates")
  revalidatePath("/dashboard/models")
  redirect(withMessage("/dashboard/templates", "success", "模板已删除"))
}

export async function cleanupUnusedTemplatesAction() {
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
      const { error } = await client.from("check_request_templates").delete().in("id", unusedTemplateIds)

      if (error) {
        throw error
      }

      successMessage = `已清理 ${unusedTemplateIds.length} 条未引用模板`
    }
  } catch (error) {
    const message = getActionErrorMessage(error, "清理未引用模板失败")
    redirect(withMessage("/dashboard/templates", "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/templates")
  revalidatePath("/dashboard/models")
  redirect(withMessage("/dashboard/templates", "success", successMessage))
}
