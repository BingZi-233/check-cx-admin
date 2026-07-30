"use client"

import {
  createTemplateAction,
  updateTemplateAction,
} from "@/app/dashboard/templates/actions"
import { ActionForm } from "@/components/admin/action-form"
import { FormField } from "@/components/admin/form-field"
import { ProviderTypeSelect } from "@/components/admin/forms/provider-type-select"
import { SubmitButton } from "@/components/admin/submit-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { CheckRequestTemplateRecord } from "@/lib/admin/types"

type TemplateFormProps = {
  template?: CheckRequestTemplateRecord
  /** 服务端预格式化好的 JSON 文本，避免把 stringifyJson 拉进客户端 bundle */
  requestHeaderText?: string
  metadataText?: string
  onCancel?: () => void
  onSuccess?: () => void
  className?: string
}

export function TemplateForm({
  template,
  requestHeaderText = "",
  metadataText = "",
  onCancel,
  onSuccess,
  className,
}: TemplateFormProps) {
  const isEdit = Boolean(template)

  return (
    <ActionForm
      action={isEdit ? updateTemplateAction : createTemplateAction}
      onSuccess={onSuccess}
      className={className ?? "grid gap-4"}
    >
      {({ isPending, fieldErrors }) => (
        <>
          {template ? <input type="hidden" name="id" value={template.id} /> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="模板名称" htmlFor="name" error={fieldErrors.name}>
              <Input
                id="name"
                name="name"
                defaultValue={template?.name ?? ""}
                required
              />
            </FormField>
            <FormField label="Provider 类型" error={fieldErrors.type}>
              <ProviderTypeSelect defaultValue={template?.type ?? "openai"} />
            </FormField>
          </div>
          <FormField
            label="请求头 JSON"
            htmlFor="request_header"
            description="可选。留空表示不覆盖默认请求头。"
            error={fieldErrors.request_header}
          >
            <Textarea
              id="request_header"
              name="request_header"
              rows={8}
              className="font-mono"
              placeholder='{"Authorization":"Bearer ..."}'
              defaultValue={requestHeaderText}
            />
          </FormField>
          <FormField
            label="metadata JSON"
            htmlFor="metadata"
            description="可选。用于补充请求体里的默认参数。"
            error={fieldErrors.metadata}
          >
            <Textarea
              id="metadata"
              name="metadata"
              rows={8}
              className="font-mono"
              placeholder='{"temperature":0}'
              defaultValue={metadataText}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
            ) : null}
            <SubmitButton isPending={isPending} pendingText="保存中">
              {isEdit ? "保存更改" : "创建模板"}
            </SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  )
}
