import Link from "next/link"
import { notFound } from "next/navigation"

import { deleteGroupAction, updateGroupAction } from "@/app/dashboard/groups/actions"
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
import { formatDateTime } from "@/lib/admin/format"
import { getGroupById } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function EditGroupPage({
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
    return <PageHeader title="编辑分组" description="缺少 service role，这页不会工作。" />
  }

  const group = await getGroupById(id)

  if (!group) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`编辑：${group.group_name}`}
        description={`创建于 ${formatDateTime(group.created_at)}，更新于 ${formatDateTime(group.updated_at)}`}
        actions={
          <Button variant="outline" render={<Link href="/dashboard/groups" />}>
            返回列表
          </Button>
        }
      />
      {success ? <Notice title="保存成功" description={success} variant="success" /> : null}
      {error ? <Notice title="保存失败" description={error} variant="warning" /> : null}
      <Card>
        <CardHeader>
          <CardTitle>分组信息</CardTitle>
          <CardDescription>
            如果要改 `group_name`，先确保对应配置也会同步调整。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateGroupAction} className="grid gap-5">
            <input type="hidden" name="id" value={group.id} />
            <div className="space-y-2">
              <Label htmlFor="group_name">分组名称</Label>
              <Input id="group_name" name="group_name" defaultValue={group.group_name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website_url">网站地址</Label>
              <Input id="website_url" name="website_url" defaultValue={group.website_url ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">标签</Label>
              <Input id="tags" name="tags" defaultValue={group.tags} />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit">保存更改</Button>
              <Button variant="outline" render={<Link href="/dashboard/groups" />}>
                取消
              </Button>
            </div>
          </form>
          <form action={deleteGroupAction} className="mt-6 border-t pt-6">
            <input type="hidden" name="id" value={group.id} />
            <Button type="submit" variant="destructive">
              删除分组
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
