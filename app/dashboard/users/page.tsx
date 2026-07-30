import { UsersTable } from "@/app/dashboard/users/users-table"
import { InviteUserForm } from "@/components/admin/forms/invite-user-form"
import { PageHeader } from "@/components/admin/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireAdminUser } from "@/lib/admin/auth"
import { listAdminUsers, listGroups } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function UsersPage() {
  await requireAdminUser()

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="允许用户"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
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
    <div className="space-y-4">
      <PageHeader
        title="允许用户"
        description="维护 GitHub 登录邮箱允许名单和预设分组；对方首次 GitHub 登录后会自动绑定 auth_user_id。"
      />
      <Card>
        <CardHeader>
          <CardTitle>写入允许名单</CardTitle>
          <CardDescription>
            填对方实际用于 GitHub 登录的邮箱。成员必须预设 `group_name`，管理员可以留空。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteUserForm groupNames={groupNames} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>用户目录</CardTitle>
          <CardDescription>
            `ADMIN_EMAILS` 里的 bootstrap 管理员不会出现在这张表里。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} />
        </CardContent>
      </Card>
    </div>
  )
}
