import { NotificationsList } from "@/app/dashboard/notifications/notifications-list"
import { PageHeader } from "@/components/admin/page-header"
import { requireAdminUser } from "@/lib/admin/auth"
import { listNotifications } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function NotificationsPage() {
  await requireAdminUser()

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="系统通知"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  const notifications = await listNotifications()
  const activeCount = notifications.filter((item) => item.is_active).length

  return (
    <div className="space-y-4">
      <PageHeader
        title="系统通知"
        description={`共 ${notifications.length} 条，其中 ${activeCount} 条正在前台展示。内容按 Markdown 渲染。`}
      />
      <NotificationsList notifications={notifications} />
    </div>
  )
}
