import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, Trash2Icon } from "lucide-react"

import { deleteGroupAction } from "@/app/dashboard/groups/actions"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { GroupForm } from "@/components/admin/forms/group-form"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireAdminUser } from "@/lib/admin/auth"
import { formatDateTime } from "@/lib/admin/format"
import { getGroupById } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminUser()
  const { id } = await params

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="编辑分组"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  const group = await getGroupById(id)

  if (!group) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={`编辑：${group.group_name}`}
        description={`创建于 ${formatDateTime(group.created_at)}，更新于 ${formatDateTime(group.updated_at)}`}
        actions={
          <Button variant="outline" render={<Link href="/dashboard/groups" />}>
            <ArrowLeftIcon />
            返回列表
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>分组信息</CardTitle>
          <CardDescription>
            改 `group_name` 之前，先确保引用它的配置也会同步调整。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GroupForm group={group} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>危险操作</CardTitle>
          <CardDescription>删除后无法恢复。</CardDescription>
        </CardHeader>
        <CardContent>
          <ConfirmActionDialog
            trigger={
              <Button type="button" variant="destructive">
                <Trash2Icon />
                删除分组
              </Button>
            }
            title="确认删除分组？"
            description={`将删除分组「${group.group_name}」。引用了这个名字的配置不会自动更新，请先确认无人使用。`}
            action={deleteGroupAction}
            fields={{ id: group.id }}
            confirmLabel="确认删除"
            pendingLabel="删除中"
          />
        </CardContent>
      </Card>
    </div>
  )
}
