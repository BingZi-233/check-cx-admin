"use server"

import { revalidatePath } from "next/cache"

import {
  actionSuccess,
  toActionError,
  ValidationError,
  type ActionState,
} from "@/lib/admin/action-result"
import { requireAppUser } from "@/lib/admin/auth"
import {
  booleanFromForm,
  optionalString,
  parseProviderType,
  requiredString,
} from "@/lib/admin/forms"
import { getRequiredGroupName, isAdminUser } from "@/lib/admin/permissions"
import { listSelectableModels } from "@/lib/admin/queries"
import { createAdminClient } from "@/lib/admin/supabase-admin"
import type { AppUser, ProviderType } from "@/lib/admin/types"

type BatchConfigOperation =
  | "enable"
  | "disable"
  | "maintenance_on"
  | "maintenance_off"
  | "replace_model"
  | "replace_key"
  | "replace_endpoint"
  | "replace_name"
  | "clear_history"
  | "delete"

function revalidateConfigPaths(id?: string) {
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/configs")
  revalidatePath("/dashboard/system")

  if (id) {
    revalidatePath(`/dashboard/configs/${id}`)
  }
}

function parseBatchConfigOperation(
  value: FormDataEntryValue | null
): BatchConfigOperation {
  const operation = value?.toString()

  if (
    operation === "enable" ||
    operation === "disable" ||
    operation === "maintenance_on" ||
    operation === "maintenance_off" ||
    operation === "replace_model" ||
    operation === "replace_key" ||
    operation === "replace_endpoint" ||
    operation === "replace_name" ||
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

function normalizeGroupName(value: string | null | undefined) {
  const groupName = value?.trim() ?? ""
  return groupName.length > 0 ? groupName : null
}

function applyScopeToIdQuery<T extends { eq: (column: string, value: unknown) => T }>(
  query: T,
  user: AppUser
) {
  if (isAdminUser(user)) {
    return query
  }

  return query.eq("group_name", getRequiredGroupName(user))
}

async function getScopedConfig(
  user: AppUser,
  id: string,
  select = "id, name, type, group_name"
) {
  const client = createAdminClient()
  const scopedQuery = applyScopeToIdQuery(
    client.from("check_configs").select(select).eq("id", id),
    user
  )
  const { data, error } = await scopedQuery.maybeSingle()

  if (error) {
    throw error
  }

  return data
}

async function getScopedConfigs(
  user: AppUser,
  ids: string[],
  select = "id, name, type, group_name"
) {
  const client = createAdminClient()
  let query = client.from("check_configs").select(select).in("id", ids)

  if (!isAdminUser(user)) {
    query = query.eq("group_name", getRequiredGroupName(user))
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data ?? []
}

async function parseConfigPayload(formData: FormData, user: AppUser) {
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
    throw new ValidationError("model_id", "所选模型不存在")
  }

  if (model.type !== type) {
    throw new ValidationError("model_id", "模型类型和配置类型不一致")
  }

  if (!isAdminUser(user)) {
    const selectableModels = await listSelectableModels()

    if (!selectableModels.some((item) => item.id === modelId)) {
      throw new ValidationError("model_id", "所选模型不在当前成员可用范围内")
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
    group_name: isAdminUser(user)
      ? normalizeGroupName(optionalString(formData, "group_name"))
      : getRequiredGroupName(user),
  }
}

export async function createConfigAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAppUser()

  try {
    const payload = await parseConfigPayload(formData, user)
    const client = createAdminClient()
    const { error } = await client.from("check_configs").insert(payload)

    if (error) {
      throw error
    }
  } catch (error) {
    return toActionError(error, "创建配置失败")
  }

  revalidateConfigPaths()

  return actionSuccess("配置已创建", "/dashboard/configs")
}

export async function updateConfigAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAppUser()

  try {
    const id = requiredString(formData, "id", "配置 ID")
    const existing = await getScopedConfig(user, id)

    if (!existing) {
      throw new Error("指定配置不存在，或你没有权限修改它")
    }

    const payload = await parseConfigPayload(formData, user)
    const client = createAdminClient()
    const { error } = await client.from("check_configs").update(payload).eq("id", id)

    if (error) {
      throw error
    }

    revalidateConfigPaths(id)

    return actionSuccess("配置已更新")
  } catch (error) {
    return toActionError(error, "更新配置失败")
  }
}

export async function deleteConfigAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAppUser()

  try {
    const id = requiredString(formData, "id", "配置 ID")
    const existing = await getScopedConfig(user, id)

    if (!existing) {
      throw new Error("指定配置不存在，或你没有权限删除它")
    }

    const client = createAdminClient()
    const { error } = await client.from("check_configs").delete().eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    return toActionError(error, "删除配置失败")
  }

  revalidateConfigPaths()
  revalidatePath("/dashboard/history")

  return actionSuccess("配置已删除", "/dashboard/configs")
}

export async function clearConfigHistoryAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAppUser()

  try {
    const id = requiredString(formData, "id", "配置 ID")
    const config = (await getScopedConfig(user, id, "id, name")) as unknown as {
      id: string
      name: string
    } | null

    if (!config) {
      throw new Error("指定配置不存在，或你没有权限清理它")
    }

    const client = createAdminClient()
    const { error } = await client.from("check_history").delete().eq("config_id", id)

    if (error) {
      throw error
    }

    revalidateConfigPaths(id)
    revalidatePath("/dashboard/history")

    return actionSuccess(`已清理配置「${config.name}」的请求历史`)
  } catch (error) {
    return toActionError(error, "清理请求历史失败")
  }
}

export async function batchConfigAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAppUser()

  let successMessage = ""

  try {
    const ids = getSelectedConfigIds(formData)
    const operation = parseBatchConfigOperation(formData.get("operation"))
    const client = createAdminClient()
    const selectedConfigs = (await getScopedConfigs(
      user,
      ids,
      "id, name, type"
    )) as unknown as Array<{
      id: string
      name: string
      type: ProviderType
    }>
    const existingIds = new Set(selectedConfigs.map((item) => item.id))

    if (existingIds.size !== ids.length) {
      throw new Error("部分选中的配置不存在，或你没有权限操作它们，请刷新列表后重试")
    }

    switch (operation) {
      case "enable": {
        const { error } = await client
          .from("check_configs")
          .update({ enabled: true })
          .in("id", ids)

        if (error) {
          throw error
        }

        successMessage = `已启用 ${ids.length} 条配置`
        break
      }
      case "disable": {
        const { error } = await client
          .from("check_configs")
          .update({ enabled: false })
          .in("id", ids)

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
        const actualTypes = parseProviderTypeSet(
          selectedConfigs.map((item) => item.type)
        )

        if (actualTypes.length !== 1) {
          throw new ValidationError(
            "target_model_id",
            "选中的配置包含多个 Provider 类型，请先按类型筛选后再批量换模型"
          )
        }

        const selectedType = actualTypes[0]

        const { data: targetModel, error: targetModelError } = await client
          .from("check_models")
          .select("id, type, model")
          .eq("id", targetModelId)
          .maybeSingle()

        if (targetModelError) {
          throw targetModelError
        }

        if (!targetModel) {
          throw new ValidationError("target_model_id", "目标模型不存在")
        }

        if (!isAdminUser(user)) {
          const selectableModels = await listSelectableModels()

          if (!selectableModels.some((item) => item.id === targetModelId)) {
            throw new ValidationError(
              "target_model_id",
              "目标模型不在当前成员可用范围内"
            )
          }
        }

        if (targetModel.type !== selectedType) {
          throw new ValidationError(
            "target_model_id",
            "目标模型类型和选中配置类型不一致"
          )
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
      case "replace_key": {
        const targetApiKey = requiredString(formData, "target_api_key", "新 API Key")

        if (targetApiKey.length > 512) {
          throw new ValidationError(
            "target_api_key",
            "API Key 长度不能超过 512 个字符"
          )
        }

        const { error } = await client
          .from("check_configs")
          .update({ api_key: targetApiKey })
          .in("id", ids)

        if (error) {
          throw error
        }

        successMessage = `已替换 ${ids.length} 条配置的密钥`
        break
      }
      case "replace_endpoint": {
        const targetEndpoint = requiredString(
          formData,
          "target_endpoint",
          "新 API 地址"
        )

        if (targetEndpoint.length > 2048) {
          throw new ValidationError(
            "target_endpoint",
            "API 地址长度不能超过 2048 个字符"
          )
        }

        const { error } = await client
          .from("check_configs")
          .update({ endpoint: targetEndpoint })
          .in("id", ids)

        if (error) {
          throw error
        }

        successMessage = `已替换 ${ids.length} 条配置的地址`
        break
      }
      case "replace_name": {
        const targetName = requiredString(formData, "target_name", "新名称")

        if (targetName.length > 255) {
          throw new ValidationError("target_name", "名称长度不能超过 255 个字符")
        }

        const { error } = await client
          .from("check_configs")
          .update({ name: targetName })
          .in("id", ids)

        if (error) {
          throw error
        }

        successMessage = `已替换 ${ids.length} 条配置的名称`
        break
      }
      case "clear_history": {
        const { error } = await client
          .from("check_history")
          .delete()
          .in("config_id", ids)

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
    return toActionError(error, "批量操作失败")
  }

  revalidateConfigPaths()
  revalidatePath("/dashboard/history")

  return actionSuccess(successMessage)
}
