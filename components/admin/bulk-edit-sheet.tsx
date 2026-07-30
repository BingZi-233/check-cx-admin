"use client"

import { useState } from "react"

import { batchConfigAction } from "@/app/dashboard/configs/actions"
import { ActionForm } from "@/components/admin/action-form"
import { FormField } from "@/components/admin/form-field"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { CheckModelRecord, ProviderType } from "@/lib/admin/types"

/** 四个"批量换 X"以前是四份复制粘贴的 Sheet，现在合并成一个：先选字段，再填值。 */
const bulkFields = {
  replace_model: { label: "引用模型", operation: "replace_model" },
  replace_key: { label: "API Key", operation: "replace_key" },
  replace_endpoint: { label: "API 端点", operation: "replace_endpoint" },
  replace_name: { label: "显示名称", operation: "replace_name" },
} as const

type BulkField = keyof typeof bulkFields

const bulkFieldItems: Record<string, string> = Object.fromEntries(
  Object.entries(bulkFields).map(([key, value]) => [key, value.label])
)

type BulkEditSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: string[]
  models: CheckModelRecord[]
  /** 选中项唯一的 Provider 类型；混合类型时为 null */
  selectedProviderType: ProviderType | null
  initialField?: BulkField
  onSuccess?: () => void
}

export function BulkEditSheet({
  open,
  onOpenChange,
  selectedIds,
  models,
  selectedProviderType,
  initialField = "replace_model",
  onSuccess,
}: BulkEditSheetProps) {
  const [field, setField] = useState<BulkField>(initialField)
  const [modelId, setModelId] = useState("")

  const filteredModels = selectedProviderType
    ? models.filter((item) => item.type === selectedProviderType)
    : []
  const modelItems: Record<string, string> = Object.fromEntries(
    filteredModels.map((item) => [
      item.id,
      item.template_name ? `${item.model} · ${item.template_name}` : item.model,
    ])
  )
  const resolvedModelId =
    modelId && filteredModels.some((item) => item.id === modelId)
      ? modelId
      : (filteredModels[0]?.id ?? "")
  const mixedTypes = field === "replace_model" && !selectedProviderType

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>批量修改</SheetTitle>
          <SheetDescription>
            将对选中的 {selectedIds.length} 条配置统一写入同一个值。
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <ActionForm
            action={batchConfigAction}
            onSuccess={() => {
              onOpenChange(false)
              onSuccess?.()
            }}
            className="grid gap-4"
          >
            {({ isPending, fieldErrors }) => (
              <>
                {/* 选中的 id 就放在这个表单里，不再靠 form={id} 跨 portal 关联外层表单 */}
                {selectedIds.map((id) => (
                  <input key={id} type="hidden" name="ids" value={id} />
                ))}
                <input
                  type="hidden"
                  name="operation"
                  value={bulkFields[field].operation}
                />
                <FormField
                  label="要修改的字段"
                  description={`已选 ${selectedIds.length} 条配置。`}
                >
                  <Select
                    items={bulkFieldItems}
                    value={field}
                    onValueChange={(next) => setField(next as BulkField)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(bulkFields) as BulkField[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {bulkFields[key].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                {field === "replace_model" ? (
                  <FormField
                    label="目标模型"
                    error={fieldErrors.target_model_id}
                    description={
                      mixedTypes
                        ? "选中的配置包含多个 Provider 类型，请先按类型筛选后再批量换模型。"
                        : filteredModels.length === 0
                          ? "当前 Provider 类型下没有可用模型。"
                          : `Provider：${selectedProviderType}`
                    }
                  >
                    <input
                      type="hidden"
                      name="target_model_id"
                      value={resolvedModelId}
                    />
                    <Select
                      items={modelItems}
                      value={resolvedModelId || null}
                      onValueChange={(next) => setModelId(String(next))}
                      disabled={mixedTypes || filteredModels.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择目标模型" />
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
                ) : null}

                {field === "replace_key" ? (
                  <FormField
                    label="新 API Key"
                    htmlFor="target_api_key"
                    error={fieldErrors.target_api_key}
                  >
                    <Input
                      id="target_api_key"
                      name="target_api_key"
                      type="password"
                      placeholder="输入新的 API Key"
                      className="font-mono"
                      autoComplete="off"
                      required
                    />
                  </FormField>
                ) : null}

                {field === "replace_endpoint" ? (
                  <FormField
                    label="新 API 端点"
                    htmlFor="target_endpoint"
                    error={fieldErrors.target_endpoint}
                  >
                    <Input
                      id="target_endpoint"
                      name="target_endpoint"
                      type="url"
                      placeholder="https://api.example.com/v1"
                      className="font-mono"
                      autoComplete="off"
                      required
                    />
                  </FormField>
                ) : null}

                {field === "replace_name" ? (
                  <FormField
                    label="新显示名称"
                    htmlFor="target_name"
                    error={fieldErrors.target_name}
                  >
                    <Input
                      id="target_name"
                      name="target_name"
                      placeholder="输入新的显示名称"
                      autoComplete="off"
                      required
                    />
                  </FormField>
                ) : null}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    取消
                  </Button>
                  <SubmitButton
                    isPending={isPending}
                    pendingText="提交中"
                    disabled={
                      selectedIds.length === 0 ||
                      (field === "replace_model" && (mixedTypes || !resolvedModelId))
                    }
                  >
                    确认修改
                  </SubmitButton>
                </div>
              </>
            )}
          </ActionForm>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export type { BulkField }
