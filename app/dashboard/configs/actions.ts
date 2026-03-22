"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdminUser } from "@/lib/admin/auth"
import { requiredString, optionalString, booleanFromForm, parseProviderType, withMessage } from "@/lib/admin/forms"
import { parseOptionalJson } from "@/lib/admin/json"
import { createAdminClient } from "@/lib/admin/supabase-admin"

type BatchConfigOperation = "enable" | "disable" | "maintenance_on" | "maintenance_off" | "delete"

function withSourceMessage(message: string, sourceId: string | null) {
  const url = new URL(withMessage("/dashboard/configs/new", "error", message), "http://localhost")

  if (sourceId) {
    url.searchParams.set("source", sourceId)
  }

  return `${url.pathname}?${url.searchParams.toString()}`
}

function withPathMessage(
  path: string,
  key: "success" | "error",
  message: string
) {
  const url = new URL(path, "http://localhost")
  url.searchParams.set(key, message)

  return `${url.pathname}?${url.searchParams.toString()}`
}

function getConfigsReturnPath(formData: FormData) {
  const returnTo = optionalString(formData, "return_to")

  if (returnTo?.startsWith("/dashboard/configs")) {
    return returnTo
  }

  return "/dashboard/configs"
}

function parseBatchConfigOperation(value: FormDataEntryValue | null): BatchConfigOperation {
  const operation = value?.toString()

  if (
    operation === "enable" ||
    operation === "disable" ||
    operation === "maintenance_on" ||
    operation === "maintenance_off" ||
    operation === "delete"
  ) {
    return operation
  }

  throw new Error("批量操作类型非法")
}

function getSelectedConfigIds(formData: FormData) {
  const ids = formData
    .getAll("ids")
    .map((item) => item.toString().trim())
    .filter(Boolean)

  if (ids.length === 0) {
    throw new Error("先选中至少一条配置")
  }

  return Array.from(new Set(ids))
}

async function parseConfigPayload(formData: FormData) {
  const client = createAdminClient()
  const type = parseProviderType(requiredString(formData, "type", "Provider 类型"))
  const modelId = requiredString(formData, "model_id", "模型")
  const templateId = optionalString(formData, "template_id")

  const { data: model, error: modelError } = await client
    .from("check_models")
    .select("id, type")
    .eq("id", modelId)
    .maybeSingle()

  if (modelError) {
    throw modelError
  }

  if (!model) {
    throw new Error("所选模型不存在")
  }

  if (model.type !== type) {
    throw new Error("模型类型和配置类型不一致")
  }

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
    model_id: modelId,
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

  const sourceId = optionalString(formData, "source_config_id")

  try {
    const payload = await parseConfigPayload(formData)
    const client = createAdminClient()
    const { error } = await client.from("check_configs").insert(payload)

    if (error) {
      throw error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建配置失败"
    redirect(withSourceMessage(message, sourceId))
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

export async function batchConfigAction(formData: FormData) {
  await requireAdminUser()

  const returnPath = getConfigsReturnPath(formData)
  let successMessage = ""

  try {
    const ids = getSelectedConfigIds(formData)
    const operation = parseBatchConfigOperation(formData.get("operation"))
    const client = createAdminClient()

    switch (operation) {
      case "enable": {
        const { error } = await client.from("check_configs").update({ enabled: true }).in("id", ids)

        if (error) {
          throw error
        }

        successMessage = `已启用 ${ids.length} 条配置`
        break
      }
      case "disable": {
        const { error } = await client.from("check_configs").update({ enabled: false }).in("id", ids)

        if (error) {
          throw error
        }

        successMessage = `已停用 ${ids.length} 条配置`
        break
      }
      case "maintenance_on": {
        const { error } = await client
          .from("check_configs")
          .update({ is_maintenance: true })
          .in("id", ids)

        if (error) {
          throw error
        }

        successMessage = `已将 ${ids.length} 条配置设为维护中`
        break
      }
      case "maintenance_off": {
        const { error } = await client
          .from("check_configs")
          .update({ is_maintenance: false })
          .in("id", ids)

        if (error) {
          throw error
        }

        successMessage = `已取消 ${ids.length} 条配置的维护模式`
        break
      }
      case "delete": {
        const { error } = await client.from("check_configs").delete().in("id", ids)

        if (error) {
          throw error
        }

        successMessage = `已删除 ${ids.length} 条配置`
        break
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "批量操作失败"
    redirect(withPathMessage(returnPath, "error", message))
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/configs")
  redirect(withPathMessage(returnPath, "success", successMessage))
}
