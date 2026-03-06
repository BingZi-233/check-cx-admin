import Link from "next/link"

import { createNotificationAction } from "@/app/dashboard/notifications/actions"
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
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function NewNotificationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const error = getParam(params.error)

  if (!hasAdminDatabaseEnv()) {
    return <PageHeader title="新增系统通知" description="缺少 service role，这页不会工作。" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="新增系统通知"
        description="通知不是富文本编辑器竞赛，先把可维护性保住。"
        actions={
          <Button variant="outline" render={<Link href="/dashboard/notifications" />}>
            返回列表
          </Button>
        }
      />
      {error ? <Notice title="保存失败" description={error} variant="warning" /> : null}
      <Card>
        <CardHeader>
          <CardTitle>通知内容</CardTitle>
          <CardDescription>如果暂时不想展示，直接取消激活，不要删记录。</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createNotificationAction} className="grid gap-5">
            <div className="space-y-2">
              <Label htmlFor="message">通知内容</Label>
              <Textarea id="message" name="message" rows={8} required />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="level">通知级别</Label>
                <select
                  id="level"
                  name="level"
                  className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                  defaultValue="info"
                >
                  <option value="info">信息</option>
                  <option value="warning">警告</option>
                  <option value="error">错误</option>
                </select>
              </div>
              <div className="flex items-center pt-7 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="is_active" defaultChecked />
                  立即显示
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit">创建通知</Button>
              <Button variant="outline" render={<Link href="/dashboard/notifications" />}>
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
