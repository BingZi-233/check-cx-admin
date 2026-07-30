"use client"

import { useState } from "react"

import { inviteAdminUserAction } from "@/app/dashboard/users/actions"
import { ActionForm } from "@/components/admin/action-form"
import { FormField } from "@/components/admin/form-field"
import { SubmitButton } from "@/components/admin/submit-button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { UserRole } from "@/lib/admin/types"

const NO_GROUP = "__none__"

const roleItems: Record<UserRole, string> = {
  member: "成员",
  admin: "管理员",
}

export function InviteUserForm({ groupNames }: { groupNames: string[] }) {
  const [role, setRole] = useState<UserRole>("member")
  const [groupName, setGroupName] = useState(NO_GROUP)

  const groupItems: Record<string, string> = {
    [NO_GROUP]: "不预设分组（仅管理员可留空）",
    ...Object.fromEntries(groupNames.map((name) => [name, name])),
  }

  return (
    <ActionForm action={inviteAdminUserAction} className="grid gap-4 md:grid-cols-2">
      {({ isPending, fieldErrors }) => (
        <>
          <input type="hidden" name="role" value={role} />
          <input
            type="hidden"
            name="group_name"
            value={groupName === NO_GROUP ? "" : groupName}
          />
          <FormField label="GitHub 登录邮箱" htmlFor="email" error={fieldErrors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="github-user@example.com"
              autoComplete="off"
              required
            />
          </FormField>
          <FormField label="角色" error={fieldErrors.role}>
            <Select
              items={roleItems}
              value={role}
              onValueChange={(next) => setRole(next as UserRole)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(roleItems) as UserRole[]).map((item) => (
                  <SelectItem key={item} value={item}>
                    {roleItems[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            label="预设分组"
            className="md:col-span-2"
            description={
              groupNames.length === 0
                ? "分组列表为空，请先去「分组信息」创建分组。"
                : "选项来自分组信息。成员必须选一个，管理员可以留空。"
            }
            error={fieldErrors.group_name}
          >
            <Select
              items={groupItems}
              value={groupName}
              onValueChange={(next) => setGroupName(String(next))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_GROUP}>
                  不预设分组（仅管理员可留空）
                </SelectItem>
                {groupNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <div className="flex justify-end md:col-span-2">
            <SubmitButton isPending={isPending} pendingText="保存中">
              保存允许名单
            </SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  )
}
