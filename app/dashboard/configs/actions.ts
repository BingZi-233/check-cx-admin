"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdminUser } from "@/lib/admin/auth"
import { requiredString, optionalString, booleanFromForm, parseProviderType, withMessage } from "@/lib/admin/forms"
import { createAdminClient } from "@/lib/admin/supabase-admin"
import type { ProviderType } from "@/lib/admin/types"

type BatchConfigOperation =
  | "enable"
  | "disable"
  | "maintenance_on"
  | "maintenance_off"
  | "replace_model"
  | "clear_history"
  | "delete"

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
    operation === "replace_model" ||
    operation === "clear_history" ||
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

function parseProviderTypeSet(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((item) => item?.trim() ?? "")
        .filter(Boolean)
        .map((item) => parseProviderType(item))
    )
  ) as ProviderType[]
}

async function parseConfigPayload(formData: FormData) {
  const client = createAdminClient()
  const type = parseProviderType(requiredString(formData, "type", "Provider 类型"))
  const modelId = requiredString(formData, "model_id", "模型")

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

  return {
    name: requiredString(formData, "name", "显示名称"),
    type,
    model_id: modelId,
    endpoint: requiredString(formData, "endpoint", "API 端点"),
    api_key: requiredString(formData, "api_key", "API Key"),
    enabled: booleanFromForm(formData, "enabled"),
    is_maintenance: booleanFromForm(formData, "is_maintenance"),
    group_name: optionalString(formData, "group_name"),
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

export async function clearConfigHistoryAction(formData: FormData) {
  await requireAdminUser()

  const id = requiredString(formData, "id", "配置 ID")
  const returnPath = getConfigsReturnPath(formData)

  try {
    const client = createAdminClient()
    const { data: config, error: configError } = await client
      .from("check_configs")
      .select("id, name")
      .eq("id", id)
      .maybeSingle()

    if (configError) {
      throw configError
    }

    if (!config) {
      throw new Error("指定配置不存在或已被删除")
    }

    const { error } = await client.from("check_history").delete().eq("config_id", id)

    if (error) {
      throw error
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/configs")
    revalidatePath("/dashboard/history")
    redirect(withPathMessage(returnPath, "success", `已清理配置「${config.name}」的请求历史`))
  } catch (error) {
    const message = error instanceof Error ? error.message : "清理请求历史失败"
    redirect(withPathMessage(returnPath, "error", message))
  }
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
      case "replace_model": {
        const targetModelId = requiredString(formData, "target_model_id", "目标模型")
        const selectedTypes = parseProviderTypeSet(formData.getAll("selected_types").map((item) => item.toString()))

        if (selectedTypes.length !== 1) {
          throw new Error("选中的配置包含多个 Provider 类型，请先按类型筛选后再批量换模型")
        }

        const selectedType = selectedTypes[0]

        const [{ data: targetModel, error: targetModelError }, selectedConfigs] = await Promise.all([
          client
            .from("check_models")
            .select("id, type, model")
            .eq("id", targetModelId)
            .maybeSingle(),
          client
            .from("check_configs")
            .select("id, type")
            .in("id", ids),
        ])

        if (targetModelError) {
          throw targetModelError
        }

        if (!targetModel) {
          throw new Error("目标模型不存在")
        }

        if (selectedConfigs.error) {
          throw selectedConfigs.error
        }

        const existingIds = new Set((selectedConfigs.data ?? []).map((item) => item.id))
        if (existingIds.size !== ids.length) {
          throw new Error("部分选中的配置不存在或已被删除，请刷新列表后重试")
        }

        const actualTypes = parseProviderTypeSet((selectedConfigs.data ?? []).map((item) => item.type))
        if (actualTypes.length !== 1) {
          throw new Error("选中的配置包含多个 Provider 类型，请先按类型筛选后再批量换模型")
        }

        if (actualTypes[0] !== selectedType) {
          throw new Error("提交的配置类型与数据库实际数据不一致，请刷新页面后重试")
        }

        if (targetModel.type !== selectedType) {
          throw new Error("目标模型类型和选中配置类型不一致")
        }

        const { error } = await client
          .from("check_configs")
          .update({ model_id: targetModelId })
          .in("id", ids)

        if (error) {
          throw error
        }

        successMessage = `已将 ${ids.length} 条配置切换到模型「${targetModel.model}」`
        break
      }
      case "clear_history": {
        const { data: selectedConfigs, error: selectedConfigsError } = await client
          .from("check_configs")
          .select("id")
          .in("id", ids)

        if (selectedConfigsError) {
          throw selectedConfigsError
        }

        const existingIds = new Set((selectedConfigs ?? []).map((item) => item.id))
        if (existingIds.size !== ids.length) {
          throw new Error("部分选中的配置不存在或已被删除，请刷新列表后重试")
        }

        const { error } = await client.from("check_history").delete().in("config_id", ids)

        if (error) {
          throw error
        }

        successMessage = `已清理 ${ids.length} 条配置的请求历史`
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
  revalidatePath("/dashboard/history")
  redirect(withPathMessage(returnPath, "success", successMessage))
}
