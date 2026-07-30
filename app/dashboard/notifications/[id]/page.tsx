import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, Trash2Icon } from "lucide-react"

import { deleteNotificationAction } from "@/app/dashboard/notifications/actions"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { NotificationForm } from "@/components/admin/forms/notification-form"
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
import { getNotificationById } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function EditNotificationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminUser()
  const { id } = await params

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="编辑系统通知"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  const notification = await getNotificationById(id)

  if (!notification) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="编辑系统通知"
        description={`创建于 ${formatDateTime(notification.created_at)}`}
        actions={
          <Button
            variant="outline"
            render={<Link href="/dashboard/notifications" />}
          >
            <ArrowLeftIcon />
            返回列表
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>通知内容</CardTitle>
          <CardDescription>
            级别和显示状态会直接影响前台展示。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationForm notification={notification} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>危险操作</CardTitle>
          <CardDescription>
            只是暂时不想展示的话，把「在前台显示」关掉就够了。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfirmActionDialog
            trigger={
              <Button type="button" variant="destructive">
                <Trash2Icon />
                删除通知
              </Button>
            }
            title="确认删除这条通知？"
            description="删除后无法恢复。"
            action={deleteNotificationAction}
            fields={{ id: notification.id }}
            confirmLabel="确认删除"
            pendingLabel="删除中"
          />
        </CardContent>
      </Card>
    </div>
  )
}
