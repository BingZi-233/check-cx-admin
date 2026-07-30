import {
  TemplatesTable,
  type TemplateJsonTexts,
} from "@/app/dashboard/templates/templates-table"
import { CleanupUnusedTemplatesButton } from "@/components/admin/cleanup-unused-templates-button"
import { PageHeader } from "@/components/admin/page-header"
import { requireAdminUser } from "@/lib/admin/auth"
import { stringifyJson } from "@/lib/admin/json"
import { listTemplates } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function TemplatesPage() {
  await requireAdminUser()

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="请求模板"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  const templates = await listTemplates()
  const unusedTemplateCount = templates.filter(
    (item) => (item.model_count ?? 0) === 0
  ).length

  // JSON 在服务端格式化好再传下去，避免把 stringifyJson 拉进客户端 bundle
  const jsonTexts: TemplateJsonTexts = Object.fromEntries(
    templates.map((item) => [
      item.id,
      {
        requestHeader: stringifyJson(item.request_header),
        metadata: stringifyJson(item.metadata),
      },
    ])
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="请求模板"
        description={`共 ${templates.length} 条，其中 ${unusedTemplateCount} 条未被引用。模板类型必须和模型类型一致。`}
        actions={
          <CleanupUnusedTemplatesButton unusedCount={unusedTemplateCount} />
        }
      />
      <TemplatesTable templates={templates} jsonTexts={jsonTexts} />
    </div>
  )
}
