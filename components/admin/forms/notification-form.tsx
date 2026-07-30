"use client"

import { useState } from "react"

import {
  createNotificationAction,
  updateNotificationAction,
} from "@/app/dashboard/notifications/actions"
import { ActionForm } from "@/components/admin/action-form"
import { FormField } from "@/components/admin/form-field"
import { MarkdownPreview } from "@/components/admin/markdown-preview"
import { SubmitButton } from "@/components/admin/submit-button"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { NotificationLevel, SystemNotificationRecord } from "@/lib/admin/types"

const levelItems: Record<NotificationLevel, string> = {
  info: "信息",
  warning: "警告",
  error: "错误",
}

type NotificationFormProps = {
  notification?: SystemNotificationRecord
  onCancel?: () => void
  onSuccess?: () => void
  className?: string
}

export function NotificationForm({
  notification,
  onCancel,
  onSuccess,
  className,
}: NotificationFormProps) {
  const isEdit = Boolean(notification)
  const [message, setMessage] = useState(notification?.message ?? "")

  return (
    <ActionForm
      action={isEdit ? updateNotificationAction : createNotificationAction}
      onSuccess={onSuccess}
      className={className ?? "grid gap-4"}
    >
      {({ isPending, fieldErrors }) => (
        <>
          {notification ? (
            <input type="hidden" name="id" value={notification.id} />
          ) : null}
          <FormField
            label="通知内容"
            htmlFor="message"
            description="支持 Markdown，可以先在预览页确认前台呈现效果。"
            error={fieldErrors.message}
          >
            {/* 编辑框始终挂载，避免切到预览时表单字段被卸载导致提交丢值 */}
            <div className="grid gap-3 lg:grid-cols-2">
              <Textarea
                id="message"
                name="message"
                rows={9}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
              />
              <div className="min-h-36 overflow-auto rounded-md border bg-muted/30 p-3">
                {message.trim().length > 0 ? (
                  <MarkdownPreview content={message} />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    右侧是前台渲染效果，先在左边写点内容。
                  </p>
                )}
              </div>
            </div>
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="通知级别" error={fieldErrors.level}>
              <Select
                name="level"
                items={levelItems}
                defaultValue={notification?.level ?? "info"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(levelItems) as NotificationLevel[]).map((level) => (
                    <SelectItem key={level} value={level}>
                      {levelItems[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <Field orientation="horizontal" className="w-auto gap-2 self-end pb-1">
              <Switch
                id="is_active"
                name="is_active"
                defaultChecked={notification ? Boolean(notification.is_active) : true}
              />
              <FieldLabel htmlFor="is_active">在前台显示</FieldLabel>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
            ) : null}
            <SubmitButton isPending={isPending} pendingText="保存中">
              {isEdit ? "保存更改" : "创建通知"}
            </SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  )
}
