import Link from "next/link"

import { createGroupAction } from "@/app/dashboard/groups/actions"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function NewGroupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const error = getParam(params.error)

  if (!hasAdminDatabaseEnv()) {
    return <PageHeader title="新增分组" description="缺少 service role，这页不会工作。" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="新增分组"
        description="分组是文本关联，不是外键。改名要谨慎。"
        actions={
          <Button variant="outline" render={<Link href="/dashboard/groups" />}>
            返回列表
          </Button>
        }
      />
      {error ? <Notice title="保存失败" description={error} variant="warning" /> : null}
      <Card>
        <CardHeader>
          <CardTitle>分组信息</CardTitle>
          <CardDescription>标签用英文逗号分隔，别引入花哨结构。</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createGroupAction} className="grid gap-5">
            <div className="space-y-2">
              <Label htmlFor="group_name">分组名称</Label>
              <Input id="group_name" name="group_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website_url">网站地址</Label>
              <Input
                id="website_url"
                name="website_url"
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">标签</Label>
              <Input id="tags" name="tags" placeholder="official,public,fast" />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit">创建分组</Button>
              <Button variant="outline" render={<Link href="/dashboard/groups" />}>
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
