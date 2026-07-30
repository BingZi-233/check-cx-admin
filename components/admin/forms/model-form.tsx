"use client"

import { useState } from "react"

import { createModelAction, updateModelAction } from "@/app/dashboard/models/actions"
import { ActionForm } from "@/components/admin/action-form"
import { FormField } from "@/components/admin/form-field"
import { ProviderTypeSelect } from "@/components/admin/forms/provider-type-select"
import { SubmitButton } from "@/components/admin/submit-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CheckModelRecord, CheckRequestTemplateRecord, ProviderType } from "@/lib/admin/types"

const NO_TEMPLATE = "__none__"

type ModelFormProps = {
  templates: CheckRequestTemplateRecord[]
  model?: CheckModelRecord
  onCancel?: () => void
  onSuccess?: () => void
  className?: string
}

export function ModelForm({
  templates,
  model,
  onCancel,
  onSuccess,
  className,
}: ModelFormProps) {
  const isEdit = Boolean(model)
  const [type, setType] = useState<ProviderType>(model?.type ?? "openai")
  const initialTemplateId =
    model?.template_id &&
    templates.some(
      (item) => item.id === model.template_id && item.type === model.type
    )
      ? model.template_id
      : NO_TEMPLATE
  const [templateId, setTemplateId] = useState(initialTemplateId)

  const filteredTemplates = templates.filter((item) => item.type === type)
  const templateItems: Record<string, string> = {
    [NO_TEMPLATE]: "不使用模板",
    ...Object.fromEntries(filteredTemplates.map((item) => [item.id, item.name])),
  }

  return (
    <ActionForm
      action={isEdit ? updateModelAction : createModelAction}
      onSuccess={onSuccess}
      className={className ?? "grid gap-4"}
    >
      {({ isPending, fieldErrors }) => (
        <>
          {model ? <input type="hidden" name="id" value={model.id} /> : null}
          {/* 模板可以为空，用哨兵值占位，提交前转成空字符串 */}
          <input
            type="hidden"
            name="template_id"
            value={templateId === NO_TEMPLATE ? "" : templateId}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="模型名称"
              htmlFor="model"
              error={fieldErrors.model}
            >
              <Input
                id="model"
                name="model"
                placeholder="gpt-4o-mini"
                defaultValue={model?.model ?? ""}
                required
              />
            </FormField>
            <FormField label="Provider 类型" error={fieldErrors.type}>
              <ProviderTypeSelect
                value={type}
                onValueChange={(next) => {
                  setType(next)
                  setTemplateId(NO_TEMPLATE)
                }}
              />
            </FormField>
            <FormField
              label="请求模板"
              className="md:col-span-2"
              description="模板是默认请求参数的唯一来源，模型只负责关联它。"
              error={fieldErrors.template_id}
            >
              <Select
                items={templateItems}
                value={templateId}
                onValueChange={(next) => setTemplateId(String(next))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TEMPLATE}>不使用模板</SelectItem>
                  {filteredTemplates.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
            ) : null}
            <SubmitButton isPending={isPending} pendingText="保存中">
              {isEdit ? "保存更改" : "创建模型"}
            </SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  )
}
