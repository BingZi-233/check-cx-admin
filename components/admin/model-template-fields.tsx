"use client"

import { useState } from "react"

import type { CheckRequestTemplateRecord, ProviderType } from "@/lib/admin/types"

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"

type ModelTemplateFieldsProps = {
  initialType: ProviderType
  initialTemplateId: string
  templates: CheckRequestTemplateRecord[]
}

export function ModelTemplateFields({
  initialType,
  initialTemplateId,
  templates,
}: ModelTemplateFieldsProps) {
  function isTemplateMatch(targetType: ProviderType, templateId: string) {
    return templates.some((item) => item.type === targetType && item.id === templateId)
  }

  const [type, setType] = useState<ProviderType>(initialType)
  const [templateId, setTemplateId] = useState(
    isTemplateMatch(initialType, initialTemplateId) ? initialTemplateId : ""
  )

  const filteredTemplates = templates.filter((item) => item.type === type)

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
            setTemplateId("")
          }}
          className={selectClassName}
        >
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">请求模板</span>
        <select
          name="template_id"
          value={templateId}
          onChange={(event) => setTemplateId(event.target.value)}
          className={selectClassName}
        >
          <option value="">不使用模板</option>
          {filteredTemplates.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}
