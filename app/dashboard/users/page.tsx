import { Notice } from "@/components/admin/notice"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireAdminUser } from "@/lib/admin/auth"
import { nativeSelectClassName } from "@/lib/admin/forms"
import { formatDateTime } from "@/lib/admin/format"
import { listAdminUsers, listGroups } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

import { inviteAdminUserAction } from "./actions"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdminUser()

  const params = await searchParams
  const error = getParam(params.error)
  const success = getParam(params.success)

  if (!hasAdminDatabaseEnv()) {
    return <PageHeader title="允许用户" description="缺少 service role 凭据，当前页面暂不可用。" />
  }

  const [users, groups] = await Promise.all([listAdminUsers(), listGroups()])
  const groupNames = Array.from(
    new Set(
      groups
        .map((item) => item.group_name?.trim())
        .filter((item): item is string => Boolean(item))
    )
  ).sort((left, right) => left.localeCompare(right, "zh-Hans-CN"))

  return (
    <div className="space-y-6">
      <PageHeader
        title="允许用户"
        description="这里只维护 GitHub 登录邮箱允许名单和预设分组；首次 GitHub 登录后会自动绑定。"
      />
      {success ? <Notice title="操作成功" description={success} variant="success" /> : null}
      {error ? <Notice title="操作失败" description={error} variant="warning" /> : null}
      <Card>
        <CardHeader>
          <CardTitle>写入允许名单</CardTitle>
          <CardDescription>
            这里填写的是对方实际用于 GitHub 登录的邮箱。成员必须提前写死 `group_name`；管理员可以留空。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={inviteAdminUserAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" name="email" type="email" placeholder="github-user@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">角色</Label>
              <select
                id="role"
                name="role"
                defaultValue="member"
                className={nativeSelectClassName}
              >
                <option value="member">成员</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="group_name">预设分组</Label>
              <select
                id="group_name"
                name="group_name"
                defaultValue=""
                className={nativeSelectClassName}
              >
                <option value="">不预设分组（管理员可留空）</option>
                {groupNames.map((groupName) => (
                  <option key={groupName} value={groupName}>
                    {groupName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                选项来自分组信息。成员必须选一个；如果列表为空，先去“分组信息”里创建。
              </p>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">保存允许名单</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>用户目录</CardTitle>
          <CardDescription>
            首次成功使用 GitHub 登录后会自动回填 `auth_user_id` 和激活时间。`ADMIN_EMAILS` 里的 bootstrap 管理员不会出现在这张表里。
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 pr-4">GitHub 邮箱</th>
                <th className="py-3 pr-4">角色</th>
                <th className="py-3 pr-4">预设分组</th>
                <th className="py-3 pr-4">状态</th>
                <th className="py-3 pr-4">写入时间</th>
                <th className="py-3 pr-4">激活时间</th>
                <th className="py-3 pr-4">Auth 用户</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id} className="border-b align-top last:border-0">
                  <td className="py-3 pr-4 font-medium">{item.email}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={item.role === "admin" ? "default" : "outline"}>
                      {item.role === "admin" ? "管理员" : "成员"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{item.group_name ?? "-"}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={item.activated_at ? "default" : "secondary"}>
                      {item.activated_at ? "已绑定" : "待 GitHub 首登"}
                    </Badge>
                    {item.is_active === false ? (
                      <Badge variant="outline" className="ml-2">已停用</Badge>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{formatDateTime(item.invited_at)}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{formatDateTime(item.activated_at)}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                    {item.auth_user_id ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
