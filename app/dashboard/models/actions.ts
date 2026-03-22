"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdminUser } from "@/lib/admin/auth"
import { parseProviderType, requiredString, withMessage } from "@/lib/admin/forms"
import { parseOptionalJson } from "@/lib/admin/json"
import { createAdminClient } from "@/lib/admin/supabase-admin"

async function parseModelPayload(formData: FormData) {
  return {
    type: parseProviderType(requiredString(formData, "type", "Provider 类型")),
    model: requiredString(formData, "model", "模型名称"),
    request_header: parseOptionalJson(formData.get("request_header"), "请求头 JSON"),
    metadata: parseOptionalJson(formData.get("metadata"), "metadata JSON"),
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
    const message = error instanceof Error ? error.message : "创建模型失败"
    redirect(withMessage("/dashboard/models/new", "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/models")
  revalidatePath("/dashboard/configs")
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
    const message = error instanceof Error ? error.message : "更新模型失败"
    redirect(withMessage(`/dashboard/models/${id}`, "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/models")
  revalidatePath("/dashboard/configs")
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
    const message = error instanceof Error ? error.message : "删除模型失败"
    redirect(withMessage(`/dashboard/models/${id}`, "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/models")
  revalidatePath("/dashboard/configs")
  redirect(withMessage("/dashboard/models", "success", "模型已删除"))
}

