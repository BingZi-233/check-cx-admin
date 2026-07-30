import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

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
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function NewNotificationPage() {
  await requireAdminUser()

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="新增系统通知"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="新增系统通知"
        description="内容支持 Markdown，右侧可以实时看到前台渲染效果。"
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
            暂时不想展示的话，把「在前台显示」关掉就行，不用删记录。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationForm />
        </CardContent>
      </Card>
    </div>
  )
}
