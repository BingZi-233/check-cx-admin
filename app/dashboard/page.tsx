import Link from "next/link"
import { ArrowRightIcon, InboxIcon } from "lucide-react"

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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { requireAppUser } from "@/lib/admin/auth"
import { formatDateTime } from "@/lib/admin/format"
import { isAdminUser } from "@/lib/admin/permissions"
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
    description: "管理检测实例、端点、分组和密钥。",
    href: "/dashboard/configs",
  },
  {
    title: "模型配置",
    description: "统一维护模型名称和模板绑定。",
    href: "/dashboard/models",
  },
  {
    title: "请求模板",
    description: "复用请求头和 metadata。",
    href: "/dashboard/templates",
  },
  {
    title: "分组与通知",
    description: "维护前台展示所需的分组和通知。",
    href: "/dashboard/groups",
  },
]

export default async function DashboardPage() {
  const user = await requireAppUser()
  const adminUser = isAdminUser(user)

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="概览"
        description="请先补全后台所需环境变量，再使用概览页面。"
      />
    )
  }

  const [summary, recentHistory, lease, notifications] = await Promise.all([
    getDashboardSummary(user),
    listRecentHistory(user, 8),
    adminUser ? getPollerLease() : Promise.resolve(null),
    adminUser ? listNotifications() : Promise.resolve([]),
  ])

  const stats = [
    {
      label: "模型配置",
      value: summary.modelCount,
      hint: "模板绑定统一在模型层收口。",
    },
    {
      label: "Provider 配置",
      value: summary.configCount,
      hint: `启用 ${summary.enabledConfigCount} · 维护 ${summary.maintenanceConfigCount}`,
    },
    {
      label: "请求模板",
      value: summary.templateCount,
      hint: "模板越清晰，配置维护越简单。",
    },
    {
      label: "分组",
      value: summary.groupCount,
      hint: "前台分组展示和后台文本要保持一致。",
    },
    {
      label: adminUser ? "活跃通知" : "失败/错误记录",
      value: adminUser
        ? summary.activeNotificationCount
        : summary.recentErrorCount,
      hint: adminUser
        ? `历史失败/错误总数：${summary.recentErrorCount}`
        : "只统计当前分组配置的失败与错误。",
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="概览"
        description={
          adminUser
            ? "查看关键对象和最近状态，快速了解后台当前情况。"
            : `只展示你所在分组「${user.groupName}」的配置和运行结果。`
        }
      />

      <div
        className={`grid gap-3 md:grid-cols-2 ${adminUser ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}
      >
        {stats
          .filter((item) => adminUser || item.label !== "活跃通知")
          .map((item) => (
            <Card key={item.label}>
              <CardHeader>
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-2xl">{item.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {item.hint}
              </CardContent>
            </Card>
          ))}
      </div>

      <div className={`grid gap-4 ${adminUser ? "xl:grid-cols-[1.2fr_0.8fr]" : ""}`}>
        <Card>
          <CardHeader>
            <CardTitle>快速入口</CardTitle>
            <CardDescription>
              {adminUser
                ? "常用管理入口集中在这里。"
                : "你只需要关心自己分组里的配置，全局对象交给管理员。"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {quickLinks
              .filter((item) => adminUser || item.href === "/dashboard/configs")
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-medium">{item.title}</h2>
                    <ArrowRightIcon className="size-3.5 text-muted-foreground" />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </Link>
              ))}
          </CardContent>
        </Card>
        {adminUser ? (
          <Card>
            <CardHeader>
              <CardTitle>轮询主节点</CardTitle>
              <CardDescription>先确认轮询节点租约状态是否正常。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {[
                { label: "租约键", value: lease?.lease_key ?? "poller" },
                { label: "Leader", value: lease?.leader_id ?? "暂无" },
                {
                  label: "租约到期",
                  value: formatDateTime(lease?.lease_expires_at),
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 rounded-lg border p-2.5"
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
      </div>

      <div className={`grid gap-4 ${adminUser ? "xl:grid-cols-[1.2fr_0.8fr]" : ""}`}>
        <Card>
          <CardHeader>
            <CardTitle>最近检测记录</CardTitle>
            <CardDescription>
              最近 8 条结果。
              <Link
                href="/dashboard/history"
                className="ml-1 underline underline-offset-4 hover:text-foreground"
              >
                查看全部
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentHistory.length > 0 ? (
              recentHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg border p-2.5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-xs font-medium">
                      {item.check_configs?.name ?? item.config_id}
                    </p>
                    <p className="truncate text-[0.6875rem] text-muted-foreground">
                      {item.check_configs?.model ?? "-"} ·{" "}
                      {formatDateTime(item.checked_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 self-start md:self-center">
                    <HistoryStatusBadge status={item.status} />
                    <Badge variant="outline">{item.latency_ms ?? "-"} ms</Badge>
                  </div>
                </div>
              ))
            ) : (
              <Empty className="border py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <InboxIcon />
                  </EmptyMedia>
                  <EmptyTitle>还没有检测记录</EmptyTitle>
                  <EmptyDescription>
                    轮询节点跑起来之后这里会有数据。
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
        {adminUser ? (
          <Card>
            <CardHeader>
              <CardTitle>当前通知</CardTitle>
              <CardDescription>
                只展示最新几条。
                <Link
                  href="/dashboard/notifications"
                  className="ml-1 underline underline-offset-4 hover:text-foreground"
                >
                  去维护
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-lg border p-2.5 text-xs">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <Badge variant={item.is_active ? "default" : "outline"}>
                        {item.is_active ? "显示中" : "已停用"}
                      </Badge>
                      <span className="text-[0.6875rem] text-muted-foreground">
                        {formatDateTime(item.created_at)}
                      </span>
                    </div>
                    <p className="line-clamp-3 whitespace-pre-wrap text-muted-foreground">
                      {item.message}
                    </p>
                  </div>
                ))
              ) : (
                <Empty className="border py-8">
                  <EmptyHeader>
                    <EmptyTitle>没有系统通知</EmptyTitle>
                    <EmptyDescription>
                      需要挂前台公告时再新增。
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
