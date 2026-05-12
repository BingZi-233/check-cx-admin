import { PageHeader } from "@/components/admin/page-header"
import { ProviderBadge } from "@/components/admin/status-badge"
import { Badge } from "@/components/ui/badge"
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
    return <PageHeader title="运行状态" description="缺少 service role 凭据，当前页面暂不可用。" />
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="运行状态"
        description={
          adminUser
            ? "查看关键运行信息，包括租约状态和配置可用性。"
            : `这里只展示分组「${user.groupName}」的配置可用性。`
        }
      />
      <div className={`grid gap-4 ${adminUser ? "xl:grid-cols-[0.8fr_1.2fr]" : ""}`}>
        {adminUser ? (
          <Card>
            <CardHeader>
              <CardTitle>轮询租约</CardTitle>
              <CardDescription>显示主节点租约状态，用于确认多节点轮询是否正常。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-muted-foreground">租约键</span>
                <span className="font-medium">{lease?.lease_key ?? "poller"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-muted-foreground">Leader</span>
                <span className="font-medium">{lease?.leader_id ?? "暂无"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-muted-foreground">租约到期</span>
                <span className="font-medium">{formatDateTime(lease?.lease_expires_at)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-muted-foreground">最后更新时间</span>
                <span className="font-medium">{formatDateTime(lease?.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>配置可用性</CardTitle>
            <CardDescription>基于 `availability_stats` 视图，展示 7/15/30 天窗口。</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-3 pr-4 font-medium">配置</th>
                  <th className="py-3 pr-4 font-medium">类型</th>
                  <th className="py-3 pr-4 font-medium">7 天</th>
                  <th className="py-3 pr-4 font-medium">15 天</th>
                  <th className="py-3 pr-4 font-medium">30 天</th>
                  <th className="py-3 pr-4 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((config) => {
                  const configStats = statMap.get(config.id)
                  return (
                    <tr key={config.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{config.name}</td>
                      <td className="py-3 pr-4"><ProviderBadge type={config.type} /></td>
                      <td className="py-3 pr-4">{configStats?.get("7d") ?? "-"}%</td>
                      <td className="py-3 pr-4">{configStats?.get("15d") ?? "-"}%</td>
                      <td className="py-3 pr-4">{configStats?.get("30d") ?? "-"}%</td>
                      <td className="space-x-2 py-3 pr-4">
                        <Badge variant={config.enabled ? "default" : "outline"}>
                          {config.enabled ? "启用" : "停用"}
                        </Badge>
                        <Badge variant={config.is_maintenance ? "secondary" : "outline"}>
                          {config.is_maintenance ? "维护中" : "正常"}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
