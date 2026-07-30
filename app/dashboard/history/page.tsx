import { HistoryTable } from "@/app/dashboard/history/history-table"
import { PageHeader } from "@/components/admin/page-header"
import { requireAppUser } from "@/lib/admin/auth"
import { isAdminUser } from "@/lib/admin/permissions"
import { listConfigs, queryHistory } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"
import type { HistoryStatus } from "@/lib/admin/types"

const PAGE_SIZE = 50

const historyStatuses: HistoryStatus[] = [
  "operational",
  "degraded",
  "failed",
  "validation_failed",
  "error",
]

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseStatus(value: string | undefined): HistoryStatus | null {
  return value && (historyStatuses as string[]).includes(value)
    ? (value as HistoryStatus)
    : null
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requireAppUser()

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="历史记录"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  const params = await searchParams
  const page = Math.max(1, Number.parseInt(getParam(params.page) ?? "1", 10) || 1)
  const status = parseStatus(getParam(params.status))
  const configId = getParam(params.config) || null

  const [{ rows, total }, configs] = await Promise.all([
    queryHistory(user, { page, pageSize: PAGE_SIZE, status, configId }),
    listConfigs(user),
  ])

  return (
    <div className="space-y-4">
      <PageHeader
        title="历史记录"
        description={
          isAdminUser(user)
            ? `共 ${total} 条检测结果，按时间倒序。筛选条件会写进地址栏，可以直接分享。`
            : `只展示分组「${user.groupName}」下配置的历史结果，共 ${total} 条。`
        }
      />
      <HistoryTable
        rows={rows}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        status={status}
        configId={configId}
        configOptions={configs.map((item) => ({ id: item.id, name: item.name }))}
        showGroupColumn={isAdminUser(user)}
      />
    </div>
  )
}
