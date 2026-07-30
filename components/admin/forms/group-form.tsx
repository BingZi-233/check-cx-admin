"use client"

import { createGroupAction, updateGroupAction } from "@/app/dashboard/groups/actions"
import { ActionForm } from "@/components/admin/action-form"
import { FormField } from "@/components/admin/form-field"
import { SubmitButton } from "@/components/admin/submit-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { GroupInfoRecord } from "@/lib/admin/types"

type GroupFormProps = {
  group?: GroupInfoRecord
  onCancel?: () => void
  onSuccess?: () => void
  className?: string
}

export function GroupForm({
  group,
  onCancel,
  onSuccess,
  className,
}: GroupFormProps) {
  const isEdit = Boolean(group)

  return (
    <ActionForm
      action={isEdit ? updateGroupAction : createGroupAction}
      onSuccess={onSuccess}
      className={className ?? "grid gap-4"}
    >
      {({ isPending, fieldErrors }) => (
        <>
          {group ? <input type="hidden" name="id" value={group.id} /> : null}
          <FormField
            label="分组名称"
            htmlFor="group_name"
            description="分组和配置之间是文本关联而不是外键，改名前先确认引用它的配置。"
            error={fieldErrors.group_name}
          >
            <Input
              id="group_name"
              name="group_name"
              defaultValue={group?.group_name ?? ""}
              required
            />
          </FormField>
          <FormField
            label="网站地址"
            htmlFor="website_url"
            error={fieldErrors.website_url}
          >
            <Input
              id="website_url"
              name="website_url"
              type="url"
              placeholder="https://example.com"
              defaultValue={group?.website_url ?? ""}
            />
          </FormField>
          <FormField
            label="标签"
            htmlFor="tags"
            description="使用英文逗号分隔，例如 official,public,fast。"
            error={fieldErrors.tags}
          >
            <Input
              id="tags"
              name="tags"
              placeholder="official,public,fast"
              defaultValue={group?.tags ?? ""}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
            ) : null}
            <SubmitButton isPending={isPending} pendingText="保存中">
              {isEdit ? "保存更改" : "创建分组"}
            </SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  )
}
