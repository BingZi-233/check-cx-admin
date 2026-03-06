import Link from "next/link"

import { Notice } from "@/components/admin/notice"
import { PageHeader } from "@/components/admin/page-header"
import { NotificationLevelBadge } from "@/components/admin/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateTime } from "@/lib/admin/format"
import { listNotifications } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const error = getParam(params.error)
  const success = getParam(params.success)

  if (!hasAdminDatabaseEnv()) {
    return <PageHeader title="系统通知" description="缺少 service role，这页不会工作。" />
  }

  const notifications = await listNotifications()

  return (
    <div className="space-y-6">
      <PageHeader
        title="系统通知"
        description="前台横幅内容都在这里。别让运营去改代码。"
        actions={
          <Button render={<Link href="/dashboard/notifications/new" />}>
            新增通知
          </Button>
        }
      />
      {success ? <Notice title="操作成功" description={success} variant="success" /> : null}
      {error ? <Notice title="操作失败" description={error} variant="warning" /> : null}
      <Card>
        <CardHeader>
          <CardTitle>通知列表</CardTitle>
          <CardDescription>
            内容支持 Markdown，但这里先只做纯文本编辑，不玩花活。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-lg border p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <NotificationLevelBadge level={notification.level} />
                  <Badge variant={notification.is_active ? "default" : "outline"}>
                    {notification.is_active ? "显示中" : "已停用"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(notification.created_at)}
                  </span>
                  <Button
                    variant="outline"
                    render={<Link href={`/dashboard/notifications/${notification.id}`} />}
                  >
                    编辑
                  </Button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {notification.message}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
