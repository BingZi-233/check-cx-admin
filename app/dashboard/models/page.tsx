import { ModelsTable } from "@/app/dashboard/models/models-table"
import { CleanupUnusedModelsButton } from "@/components/admin/cleanup-unused-models-button"
import { PageHeader } from "@/components/admin/page-header"
import { requireAdminUser } from "@/lib/admin/auth"
import { listModels, listTemplates } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function ModelsPage() {
  await requireAdminUser()

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="模型配置"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  const [models, templates] = await Promise.all([listModels(), listTemplates()])
  const unusedModelCount = models.filter(
    (item) => (item.config_count ?? 0) === 0
  ).length

  return (
    <div className="space-y-4">
      <PageHeader
        title="模型配置"
        description={`共 ${models.length} 条，其中 ${unusedModelCount} 条未被任何配置引用。已被引用的模型不能删除。`}
        actions={<CleanupUnusedModelsButton unusedCount={unusedModelCount} />}
      />
      <ModelsTable models={models} templates={templates} />
    </div>
  )
}
