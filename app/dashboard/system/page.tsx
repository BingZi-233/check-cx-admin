import {
  AvailabilityTable,
  type AvailabilityRow,
} from "@/app/dashboard/system/availability-table"
import { PageHeader } from "@/components/admin/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireAppUser } from "@/lib/admin/auth"
import { formatDateTime } from "@/lib/admin/format"
import { isAdminUser } from "@/lib/admin/permissions"
import { getPollerLease, listAvailabilityStats, listConfigs } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function SystemPage() {
  const user = await requireAppUser()
  const adminUser = isAdminUser(user)

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="运行状态"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  const [lease, stats, configs] = await Promise.all([
    adminUser ? getPollerLease() : Promise.resolve(null),
    listAvailabilityStats(user),
    listConfigs(user),
  ])

  const statMap = new Map<string, Map<string, number | null>>()

  for (const item of stats) {
    if (!statMap.has(item.config_id)) {
      statMap.set(item.config_id, new Map())
    }

    statMap.get(item.config_id)?.set(item.period, item.availability_pct)
  }

  const rows: AvailabilityRow[] = configs.map((config) => {
    const configStats = statMap.get(config.id)

    return {
      id: config.id,
      name: config.name,
      type: config.type,
      groupName: config.group_name,
      enabled: Boolean(config.enabled),
      isMaintenance: Boolean(config.is_maintenance),
      pct7d: configStats?.get("7d") ?? null,
      pct15d: configStats?.get("15d") ?? null,
      pct30d: configStats?.get("30d") ?? null,
    }
  })

  const leaseRows = [
    { label: "租约键", value: lease?.lease_key ?? "poller" },
    { label: "Leader", value: lease?.leader_id ?? "暂无" },
    { label: "租约到期", value: formatDateTime(lease?.lease_expires_at) },
    { label: "最后更新", value: formatDateTime(lease?.updated_at) },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="运行状态"
        description={
          adminUser
            ? "查看轮询租约状态和配置可用性，默认按 7 天可用率升序，问题最多的排在最前。"
            : `只展示分组「${user.groupName}」的配置可用性。`
        }
      />
      <div className={adminUser ? "grid gap-4 xl:grid-cols-[0.8fr_1.2fr]" : ""}>
        {adminUser ? (
          <Card>
            <CardHeader>
              <CardTitle>轮询租约</CardTitle>
              <CardDescription>
                用于确认多节点轮询里的主节点是否还活着。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaseRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 rounded-lg border p-2.5 text-xs"
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="truncate font-mono font-medium" title={row.value}>
                    {row.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>配置可用性</CardTitle>
            <CardDescription>
              基于 `availability_stats` 视图，展示 7 / 15 / 30 天窗口。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvailabilityTable rows={rows} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
