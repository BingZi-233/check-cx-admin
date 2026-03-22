"use client"

import { useState } from "react"

import type { CheckModelRecord, ProviderType } from "@/lib/admin/types"

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"

type ConfigModelFieldsProps = {
  initialType: ProviderType
  initialModelId: string
  models: CheckModelRecord[]
}

export function ConfigModelFields({
  initialType,
  initialModelId,
  models,
}: ConfigModelFieldsProps) {
  function getFirstModelId(targetType: ProviderType) {
    return models.find((item) => item.type === targetType)?.id ?? ""
  }

  const [type, setType] = useState<ProviderType>(initialType)
  const [modelId, setModelId] = useState(() => {
    const matched = models.some((item) => item.type === initialType && item.id === initialModelId)
    return matched ? initialModelId : getFirstModelId(initialType)
  })

  const filteredModels = models.filter((item) => item.type === type)

  return (
    <>
      <label className="space-y-2">
        <span className="text-sm font-medium">Provider 类型</span>
        <select
          name="type"
          value={type}
          onChange={(event) => {
            const nextType = event.target.value as ProviderType
            setType(nextType)
            setModelId(getFirstModelId(nextType))
          }}
          className={selectClassName}
        >
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">模型</span>
        <select
          name="model_id"
          value={modelId}
          onChange={(event) => setModelId(event.target.value)}
          className={selectClassName}
          required
        >
          {filteredModels.length === 0 ? (
            <option value="">当前类型下没有可选模型</option>
          ) : null}
          {filteredModels.map((item) => (
            <option key={item.id} value={item.id}>
              {item.model}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}
