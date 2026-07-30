"use client"

import { useState } from "react"

import {
  createConfigAction,
  updateConfigAction,
} from "@/app/dashboard/configs/actions"
import { ActionForm } from "@/components/admin/action-form"
import { FormField } from "@/components/admin/form-field"
import { ProviderTypeSelect } from "@/components/admin/forms/provider-type-select"
import { SubmitButton } from "@/components/admin/submit-button"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type {
  CheckConfigRecord,
  CheckModelRecord,
  ProviderType,
} from "@/lib/admin/types"

const NO_GROUP = "__none__"

type ConfigFormProps = {
  models: CheckModelRecord[]
  /** 管理员可选的分组名；成员传空数组 */
  groupNames?: string[]
  isAdmin: boolean
  /** 成员固定的分组名 */
  memberGroupName?: string | null
  config?: CheckConfigRecord
  /** 复制场景：预填但仍然是新建 */
  sourceConfig?: CheckConfigRecord
  onCancel?: () => void
  onSuccess?: () => void
  className?: string
}

export function ConfigForm({
  models,
  groupNames = [],
  isAdmin,
  memberGroupName,
  config,
  sourceConfig,
  onCancel,
  onSuccess,
  className,
}: ConfigFormProps) {
  const isEdit = Boolean(config)
  const initial = config ?? sourceConfig
  const [type, setType] = useState<ProviderType>(initial?.type ?? "openai")

  function firstModelId(targetType: ProviderType) {
    return models.find((item) => item.type === targetType)?.id ?? ""
  }

  const [modelId, setModelId] = useState(() => {
    const initialModelId = initial?.model_id ?? ""
    const matched = models.some(
      (item) => item.id === initialModelId && item.type === (initial?.type ?? "openai")
    )
    return matched ? initialModelId : firstModelId(initial?.type ?? "openai")
  })

  const initialGroupName = (config ?? sourceConfig)?.group_name?.trim() || ""
  const [groupName, setGroupName] = useState(
    initialGroupName.length > 0 ? initialGroupName : NO_GROUP
  )

  const filteredModels = models.filter((item) => item.type === type)
  const modelItems: Record<string, string> = Object.fromEntries(
    filteredModels.map((item) => [
      item.id,
      item.template_name ? `${item.model} · ${item.template_name}` : item.model,
    ])
  )
  // 分组名可能已经从 group_info 里删掉了，但配置上还留着，这种值也要能选中
  const groupItems: Record<string, string> = {
    [NO_GROUP]: "不设置分组",
    ...Object.fromEntries(groupNames.map((name) => [name, name])),
    ...(initialGroupName && !groupNames.includes(initialGroupName)
      ? { [initialGroupName]: `${initialGroupName}（已不在分组表中）` }
      : {}),
  }

  return (
    <ActionForm
      action={isEdit ? updateConfigAction : createConfigAction}
      onSuccess={onSuccess}
      className={className ?? "grid gap-4"}
    >
      {({ isPending, fieldErrors }) => (
        <>
          {config ? <input type="hidden" name="id" value={config.id} /> : null}
          <input type="hidden" name="model_id" value={modelId} />
          {isAdmin ? (
            <input
              type="hidden"
              name="group_name"
              value={groupName === NO_GROUP ? "" : groupName}
            />
          ) : (
            <input
              type="hidden"
              name="group_name"
              value={initialGroupName || memberGroupName || ""}
            />
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="显示名称" htmlFor="name" error={fieldErrors.name}>
              <Input
                id="name"
                name="name"
                defaultValue={
                  config
                    ? config.name
                    : sourceConfig
                      ? `${sourceConfig.name} - 副本`
                      : ""
                }
                required
              />
            </FormField>
            <FormField label="Provider 类型" error={fieldErrors.type}>
              <ProviderTypeSelect
                value={type}
                onValueChange={(next) => {
                  setType(next)
                  setModelId(firstModelId(next))
                }}
              />
            </FormField>
            <FormField
              label="模型"
              error={fieldErrors.model_id}
              description={
                filteredModels.length === 0
                  ? "当前 Provider 类型下没有可用模型，请先去模型页创建。"
                  : undefined
              }
            >
              <Select
                items={modelItems}
                value={modelId || null}
                onValueChange={(next) => setModelId(String(next))}
                disabled={filteredModels.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  {filteredModels.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {modelItems[item.id]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="分组" error={fieldErrors.group_name}>
              {isAdmin ? (
                <Select
                  items={groupItems}
                  value={groupName}
                  onValueChange={(next) => setGroupName(String(next))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_GROUP}>不设置分组</SelectItem>
                    {initialGroupName && !groupNames.includes(initialGroupName) ? (
                      <SelectItem value={initialGroupName}>
                        {groupItems[initialGroupName]}
                      </SelectItem>
                    ) : null}
                    {groupNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={initialGroupName || memberGroupName || ""}
                  disabled
                  readOnly
                />
              )}
            </FormField>
            <FormField
              label="API 端点"
              htmlFor="endpoint"
              className="md:col-span-2"
              error={fieldErrors.endpoint}
            >
              <Input
                id="endpoint"
                name="endpoint"
                type="url"
                placeholder="https://api.openai.com/v1/chat/completions"
                defaultValue={initial?.endpoint ?? ""}
                className="font-mono"
                required
              />
            </FormField>
            <FormField
              label="API Key"
              htmlFor="api_key"
              className="md:col-span-2"
              error={fieldErrors.api_key}
            >
              <Input
                id="api_key"
                name="api_key"
                defaultValue={initial?.api_key ?? ""}
                className="font-mono"
                autoComplete="off"
                required
              />
            </FormField>
          </div>
          <div className="flex flex-wrap gap-6 rounded-lg border bg-muted/30 p-3">
            <Field orientation="horizontal" className="w-auto gap-2">
              <Switch
                id="enabled"
                name="enabled"
                defaultChecked={config ? Boolean(config.enabled) : sourceConfig ? Boolean(sourceConfig.enabled) : true}
              />
              <FieldLabel htmlFor="enabled">启用检测</FieldLabel>
            </Field>
            <Field orientation="horizontal" className="w-auto gap-2">
              <Switch
                id="is_maintenance"
                name="is_maintenance"
                defaultChecked={Boolean(initial?.is_maintenance)}
              />
              <FieldLabel htmlFor="is_maintenance">维护模式</FieldLabel>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
            ) : null}
            <SubmitButton
              isPending={isPending}
              pendingText="保存中"
              disabled={!modelId}
            >
              {isEdit ? "保存更改" : "创建配置"}
            </SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  )
}
