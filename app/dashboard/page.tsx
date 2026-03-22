import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { PageHeader } from "@/components/admin/page-header"
import { HistoryStatusBadge } from "@/components/admin/status-badge"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateTime } from "@/lib/admin/format"
import {
  getDashboardSummary,
  getPollerLease,
  listNotifications,
  listRecentHistory,
} from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

const quickLinks = [
  {
    title: "Provider 配置",
    description: "管理检测实例、端点、模板、分组和密钥。",
    href: "/dashboard/configs",
  },
  {
    title: "模型配置",
    description: "统一维护模型名和模型级默认参数，别在实例里重复改。",
    href: "/dashboard/models",
  },
  {
    title: "请求模板",
    description: "复用请求头和 metadata，干掉重复配置。",
    href: "/dashboard/templates",
  },
  {
    title: "分组与通知",
    description: "前台展示信息都在这里，而不是散落在代码里。",
    href: "/dashboard/groups",
  },
]

export default async function DashboardPage() {
  const adminDbReady = hasAdminDatabaseEnv()

  if (!adminDbReady) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="概览"
          description="先补全环境变量，再谈 CRUD。现在还只是个壳。"
        />
      </div>
    )
  }

  const [summary, lease, notifications, recentHistory] = await Promise.all([
    getDashboardSummary(),
    getPollerLease(),
    listNotifications(),
    listRecentHistory(8),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="概览"
        description="先看关键对象和最近状态，别在模板垃圾里浪费时间。"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader>
            <CardDescription>模型配置</CardDescription>
            <CardTitle className="text-2xl">{summary.modelCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            同一模型的默认参数统一在这里收口。
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Provider 配置</CardDescription>
            <CardTitle className="text-2xl">{summary.configCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            启用 {summary.enabledConfigCount} / 维护 {summary.maintenanceConfigCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>请求模板</CardDescription>
            <CardTitle className="text-2xl">{summary.templateCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            模板越干净，配置页越不会长成垃圾堆。
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>分组</CardDescription>
            <CardTitle className="text-2xl">{summary.groupCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            前台分组展示和后台文本关联要保持一致。
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>活跃通知</CardDescription>
            <CardTitle className="text-2xl">{summary.activeNotificationCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            历史失败/错误记录总数：{summary.recentErrorCount}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>快速入口</CardTitle>
            <CardDescription>最先值得做的几个对象，已经按优先级摆好。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-medium">{item.title}</h2>
                  <ArrowRightIcon className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>轮询主节点</CardTitle>
            <CardDescription>别管花里胡哨的图表，先确认轮询节点没死。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <span className="text-muted-foreground">租约键</span>
              <span className="font-medium">{lease?.lease_key ?? "poller"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <span className="text-muted-foreground">Leader</span>
              <span className="font-medium">{lease?.leader_id ?? "暂无"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <span className="text-muted-foreground">租约到期</span>
              <span className="font-medium">{formatDateTime(lease?.lease_expires_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>最近检测记录</CardTitle>
            <CardDescription>最近 8 条结果，够你快速判断系统是不是在冒烟。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentHistory.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium">{item.check_configs?.name ?? item.config_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.check_configs?.model ?? "-"} · {formatDateTime(item.checked_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start md:self-center">
                  <HistoryStatusBadge status={item.status} />
                  <Badge variant="outline">{item.latency_ms ?? "-"} ms</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>当前通知</CardTitle>
            <CardDescription>只列最前面的几条，真正编辑去通知页。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-lg border p-3 text-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant={item.is_active ? "default" : "outline"}>
                    {item.is_active ? "显示中" : "已停用"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</span>
                </div>
                <p className="line-clamp-3 whitespace-pre-wrap text-muted-foreground">
                  {item.message}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
