import Link from "next/link"

import { Notice } from "@/components/admin/notice"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateTime, splitTags } from "@/lib/admin/format"
import { listGroups } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const error = getParam(params.error)
  const success = getParam(params.success)

  if (!hasAdminDatabaseEnv()) {
    return <PageHeader title="分组信息" description="缺少 service role，这页不会工作。" />
  }

  const groups = await listGroups()

  return (
    <div className="space-y-6">
      <PageHeader
        title="分组信息"
        description="这是前台展示层的元数据，不复杂，但必须干净。"
        actions={<Button render={<Link href="/dashboard/groups/new" />}>新增分组</Button>}
      />
      {success ? <Notice title="操作成功" description={success} variant="success" /> : null}
      {error ? <Notice title="操作失败" description={error} variant="warning" /> : null}
      <Card>
        <CardHeader>
          <CardTitle>分组列表</CardTitle>
          <CardDescription>
            这里和 `check_configs.group_name` 是文本关联。乱改名字会把前台显示搞烂。
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 pr-4 font-medium">分组名</th>
                <th className="py-3 pr-4 font-medium">网站</th>
                <th className="py-3 pr-4 font-medium">标签</th>
                <th className="py-3 pr-4 font-medium">更新时间</th>
                <th className="py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} className="border-b align-top last:border-0">
                  <td className="py-3 pr-4 font-medium">{group.group_name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {group.website_url ?? "-"}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-2">
                      {splitTags(group.tags).length > 0 ? (
                        splitTags(group.tags).map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {formatDateTime(group.updated_at)}
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      variant="outline"
                      render={<Link href={`/dashboard/groups/${group.id}`} />}
                    >
                      编辑
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
