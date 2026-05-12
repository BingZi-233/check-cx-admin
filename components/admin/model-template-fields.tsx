"use client"

import { useState } from "react"

import { nativeSelectClassName } from "@/lib/admin/forms"
import type { CheckRequestTemplateRecord, ProviderType } from "@/lib/admin/types"

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
          className={nativeSelectClassName}
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
          className={nativeSelectClassName}
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
