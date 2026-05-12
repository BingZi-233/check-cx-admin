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
import { formatDateTime } from "@/lib/admin/format"
import { listAdminUsers } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

import { inviteAdminUserAction, resendAdminUserInviteAction } from "./actions"

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
    return <PageHeader title="邀请用户" description="缺少 service role，这页不会工作。" />
  }

  const users = await listAdminUsers()

  return (
    <div className="space-y-6">
      <PageHeader
        title="邀请用户"
        description="后台改成邀请制后，用户目录和预设分组都在这里维护。"
      />
      {success ? <Notice title="操作成功" description={success} variant="success" /> : null}
      {error ? <Notice title="操作失败" description={error} variant="warning" /> : null}
      <Card>
        <CardHeader>
          <CardTitle>发送邀请</CardTitle>
          <CardDescription>
            成员必须提前写死 `group_name`。管理员可以留空，默认拥有全量配置视图。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={inviteAdminUserAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" name="email" type="email" placeholder="user@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">角色</Label>
              <select
                id="role"
                name="role"
                defaultValue="member"
                className="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
              >
                <option value="member">成员</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="group_name">预设分组</Label>
              <Input
                id="group_name"
                name="group_name"
                placeholder="成员必填，例如 LinuxDO"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">写入并发送邀请</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>用户目录</CardTitle>
          <CardDescription>
            首次成功登录后会自动回填 `auth_user_id` 和激活时间。`ADMIN_EMAILS` 里的 bootstrap 管理员不会出现在这张表里。
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 pr-4">邮箱</th>
                <th className="py-3 pr-4">角色</th>
                <th className="py-3 pr-4">预设分组</th>
                <th className="py-3 pr-4">状态</th>
                <th className="py-3 pr-4">邀请时间</th>
                <th className="py-3 pr-4">激活时间</th>
                <th className="py-3 pr-4">Auth 用户</th>
                <th className="py-3">操作</th>
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
                      {item.activated_at ? "已激活" : "待激活"}
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
                  <td className="py-3">
                    {!item.activated_at && item.is_active !== false ? (
                      <form action={resendAdminUserInviteAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <Button type="submit" variant="outline">重新发送</Button>
                      </form>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
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
