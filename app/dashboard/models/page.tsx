import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { CleanupUnusedModelsButton } from "@/components/admin/cleanup-unused-models-button"
import { ModelRowActions } from "@/components/admin/model-row-actions"
import { Notice } from "@/components/admin/notice"
import { PageHeader } from "@/components/admin/page-header"
import { ProviderBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/lib/admin/format"
import { listModels } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const success = getParam(params.success)
  const error = getParam(params.error)

  if (!hasAdminDatabaseEnv()) {
    return <PageHeader title="模型配置" description="缺少 service role，这页不会工作。" />
  }

  const models = await listModels()
  const unusedModelCount = models.filter((item) => (item.config_count ?? 0) === 0).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="模型配置"
        description="统一维护模型定义和模板绑定，别把同一模型改十遍。"
        actions={
          <div className="flex items-center gap-2">
            <CleanupUnusedModelsButton unusedCount={unusedModelCount} />
            <Button render={<Link href="/dashboard/models/new" />}><PlusIcon />新建模型</Button>
          </div>
        }
      />
      {success ? <Notice variant="success" title="操作成功" description={success} /> : null}
      {error ? <Notice variant="warning" title="操作失败" description={error} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>模型列表</CardTitle>
          <CardDescription>
            共 {models.length} 条，其中 {unusedModelCount} 条未被引用。已被引用的模型禁止删除。
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 pr-4">模型</th>
                <th className="py-3 pr-4">Provider</th>
                <th className="py-3 pr-4">模板</th>
                <th className="py-3 pr-4">引用配置</th>
                <th className="py-3 pr-4">更新时间</th>
                <th className="py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {models.map((item) => (
                <tr key={item.id} className="border-b align-top last:border-0">
                  <td className="py-3 pr-4">
                    <Link href={`/dashboard/models/${item.id}`} className="font-medium hover:underline">
                      {item.model}
                    </Link>
                  </td>
                  <td className="py-3 pr-4"><ProviderBadge type={item.type} /></td>
                  <td className="max-w-sm py-3 pr-4 truncate text-xs">
                    {item.template_name ?? "-"}
                  </td>
                  <td className="py-3 pr-4">{item.config_count ?? 0}</td>
                  <td className="py-3 pr-4">{formatDateTime(item.updated_at)}</td>
                  <td className="py-3">
                    <ModelRowActions
                      id={item.id}
                      model={item.model}
                      configCount={item.config_count ?? 0}
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
