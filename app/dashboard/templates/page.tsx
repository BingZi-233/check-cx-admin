import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { CleanupUnusedTemplatesButton } from "@/components/admin/cleanup-unused-templates-button"
import { Notice } from "@/components/admin/notice"
import { PageHeader } from "@/components/admin/page-header"
import { ProviderBadge } from "@/components/admin/status-badge"
import { TemplateRowActions } from "@/components/admin/template-row-actions"
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
  const unusedTemplateCount = templates.filter((item) => (item.model_count ?? 0) === 0).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="请求模板"
        description="模板存在的意义只有一个：消灭重复配置。"
        actions={
          <div className="flex items-center gap-2">
            <CleanupUnusedTemplatesButton unusedCount={unusedTemplateCount} />
            <Button render={<Link href="/dashboard/templates/new" />}><PlusIcon />新建模板</Button>
          </div>
        }
      />
      {success ? <Notice variant="success" title="操作成功" description={success} /> : null}
      {error ? <Notice variant="warning" title="操作失败" description={error} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>模板列表</CardTitle>
          <CardDescription>
            共 {templates.length} 条，其中 {unusedTemplateCount} 条未被引用。模板类型必须和模型类型匹配。
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 pr-4">名称</th>
                <th className="py-3 pr-4">Provider</th>
                <th className="py-3 pr-4">请求头</th>
                <th className="py-3 pr-4">metadata</th>
                <th className="py-3 pr-4">引用模型</th>
                <th className="py-3 pr-4">更新时间</th>
                <th className="py-3">操作</th>
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
                  <td className="py-3 pr-4">{item.model_count ?? 0}</td>
                  <td className="py-3 pr-4">{formatDateTime(item.updated_at)}</td>
                  <td className="py-3">
                    <TemplateRowActions
                      id={item.id}
                      name={item.name}
                      modelCount={item.model_count ?? 0}
                    />
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
