import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { Notice } from "@/components/admin/notice"
import { PageHeader } from "@/components/admin/page-header"
import { ProviderBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/lib/admin/format"
import { listTemplates } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const success = Array.isArray(params.success) ? params.success[0] : params.success
  const error = Array.isArray(params.error) ? params.error[0] : params.error

  if (!hasAdminDatabaseEnv()) {
    return <PageHeader title="请求模板" description="缺少 service role，模板页不会工作。" />
  }

  const templates = await listTemplates()

  return (
    <div className="space-y-6">
      <PageHeader
        title="请求模板"
        description="模板存在的意义只有一个：消灭重复配置。"
        actions={<Button render={<Link href="/dashboard/templates/new" />}><PlusIcon />新建模板</Button>}
      />
      {success ? <Notice variant="success" title="操作成功" description={success} /> : null}
      {error ? <Notice variant="warning" title="操作失败" description={error} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>模板列表</CardTitle>
          <CardDescription>共 {templates.length} 条。模板类型必须和配置类型匹配。</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 pr-4">名称</th>
                <th className="py-3 pr-4">Provider</th>
                <th className="py-3 pr-4">请求头</th>
                <th className="py-3 pr-4">metadata</th>
                <th className="py-3">更新时间</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((item) => (
                <tr key={item.id} className="border-b align-top last:border-0">
                  <td className="py-3 pr-4">
                    <Link href={`/dashboard/templates/${item.id}`} className="font-medium hover:underline">{item.name}</Link>
                  </td>
                  <td className="py-3 pr-4"><ProviderBadge type={item.type} /></td>
                  <td className="py-3 pr-4 max-w-sm truncate font-mono text-xs">{item.request_header ? JSON.stringify(item.request_header) : "-"}</td>
                  <td className="py-3 pr-4 max-w-sm truncate font-mono text-xs">{item.metadata ? JSON.stringify(item.metadata) : "-"}</td>
                  <td className="py-3">{formatDateTime(item.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
