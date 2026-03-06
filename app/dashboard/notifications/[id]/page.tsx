import Link from "next/link"
import { notFound } from "next/navigation"

import {
  deleteNotificationAction,
  updateNotificationAction,
} from "@/app/dashboard/notifications/actions"
import { Notice } from "@/components/admin/notice"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatDateTime } from "@/lib/admin/format"
import { getNotificationById } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function EditNotificationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const query = await searchParams
  const error = getParam(query.error)
  const success = getParam(query.success)

  if (!hasAdminDatabaseEnv()) {
    return <PageHeader title="编辑系统通知" description="缺少 service role，这页不会工作。" />
  }

  const notification = await getNotificationById(id)

  if (!notification) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="编辑系统通知"
        description={`创建于 ${formatDateTime(notification.created_at)}`}
        actions={
          <Button variant="outline" render={<Link href="/dashboard/notifications" />}>
            返回列表
          </Button>
        }
      />
      {success ? <Notice title="保存成功" description={success} variant="success" /> : null}
      {error ? <Notice title="保存失败" description={error} variant="warning" /> : null}
      <Card>
        <CardHeader>
          <CardTitle>通知内容</CardTitle>
          <CardDescription>
            激活状态和级别是运营变量，不要把它们藏起来。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateNotificationAction} className="grid gap-5">
            <input type="hidden" name="id" value={notification.id} />
            <div className="space-y-2">
              <Label htmlFor="message">通知内容</Label>
              <Textarea
                id="message"
                name="message"
                rows={8}
                defaultValue={notification.message}
                required
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="level">通知级别</Label>
                <select
                  id="level"
                  name="level"
                  className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                  defaultValue={notification.level ?? "info"}
                >
                  <option value="info">信息</option>
                  <option value="warning">警告</option>
                  <option value="error">错误</option>
                </select>
              </div>
              <div className="flex items-center pt-7 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={Boolean(notification.is_active)}
                  />
                  显示中
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit">保存更改</Button>
              <Button variant="outline" render={<Link href="/dashboard/notifications" />}>
                取消
              </Button>
            </div>
          </form>
          <form action={deleteNotificationAction} className="mt-6 border-t pt-6">
            <input type="hidden" name="id" value={notification.id} />
            <Button type="submit" variant="destructive">
              删除通知
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
