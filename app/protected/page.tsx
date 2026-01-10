import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Bell, Cog, Folder, Plus, Wrench } from 'lucide-react'

import { createAdminClient } from '@/lib/supabase/admin'
import { formatNumberZh } from '@/lib/locale'

export const dynamic = 'force-dynamic'

const TABLES = {
  configs: 'check_configs',
  groups: 'group_info',
  notifications: 'system_notifications',
} as const

const COLUMNS = {
  configEnabled: 'enabled',
  configMaintenance: 'is_maintenance',
  groupName: 'group_name',
  notificationActive: 'is_active',
} as const

type CountOrNull = number | null

type WhereEq = {
  column: string
  value: unknown
}

type CountResponse = {
  count: number | null
  error: { message: string } | null
}

type CountQuery = {
  eq(column: string, value: unknown): CountQuery
  or(filters: string): CountQuery
} & PromiseLike<CountResponse>

async function safeCount(
  supabase: SupabaseClient,
  table: string,
  where?: WhereEq,
  apply?: (query: CountQuery) => CountQuery
): Promise<CountOrNull> {
  try {
    let query = supabase.from(table).select('*', { count: 'exact', head: true }) as unknown as CountQuery
    if (where) query = query.eq(where.column, where.value)
    if (apply) query = apply(query)
    const { count, error } = await query
    if (error) return null
    return typeof count === 'number' ? count : null
  } catch {
    return null
  }
}

function formatCount(value: CountOrNull) {
  return formatNumberZh(value)
}

export default async function ProtectedPage() {
  const supabase = createAdminClient()

  const [
    totalConfigs,
    enabledConfigs,
    maintenanceConfigs,
    disabledConfigs,
    totalGroups,
    totalNotifications,
    activeNotifications,
    groupsData,
  ] = await Promise.all([
    safeCount(supabase, TABLES.configs),
    safeCount(supabase, TABLES.configs, { column: COLUMNS.configEnabled, value: true }),
    safeCount(supabase, TABLES.configs, { column: COLUMNS.configMaintenance, value: true }),
    safeCount(
      supabase,
      TABLES.configs,
      undefined,
      (query) => query.or(`${COLUMNS.configEnabled}.eq.false,${COLUMNS.configEnabled}.is.null`)
    ),
    safeCount(supabase, TABLES.groups),
    safeCount(supabase, TABLES.notifications),
    safeCount(supabase, TABLES.notifications, { column: COLUMNS.notificationActive, value: true }),
    (async () => {
      try {
        const { data, error } = await supabase
          .from(TABLES.groups)
          .select(`id, ${COLUMNS.groupName}`)
          .order(COLUMNS.groupName, { ascending: true })
          .limit(8)
        if (error) return null
        return Array.isArray(data) ? data : null
      } catch {
        return null
      }
    })(),
  ])

  const groupConfigCounts =
    groupsData === null
      ? null
      : await Promise.all(
          groupsData.map(async (group: Record<string, unknown>) => {
            const groupName = group[COLUMNS.groupName]
            const configCount =
              typeof groupName === 'string'
                ? await safeCount(supabase, TABLES.configs, { column: COLUMNS.groupName, value: groupName })
                : null
            return {
              id: String(group.id ?? ''),
              name: String(groupName ?? ''),
              configCount,
            }
          })
        )

  const groupsRemaining =
    groupConfigCounts === null || totalGroups === null
      ? null
      : Math.max(0, totalGroups - groupConfigCounts.length)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">仪表盘</h1>
          <p className="text-sm text-muted-foreground">管理后台概览</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/protected/configs">
              <Plus className="size-4" />
              新增配置
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/protected/notifications">
              <Plus className="size-4" />
              新增通知
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">检测配置统计</CardTitle>
            <Cog className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-semibold">{formatCount(totalConfigs)}</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm text-muted-foreground">已启用</span>
                <span className="text-sm font-medium text-emerald-600">
                  {formatCount(enabledConfigs)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm text-muted-foreground">维护中</span>
                <span className="text-sm font-medium text-sky-600">
                  {formatCount(maintenanceConfigs)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm text-muted-foreground">已禁用</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {formatCount(disabledConfigs)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">分组统计</CardTitle>
            <Folder className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-semibold">{formatCount(totalGroups)}</div>
            <div className="space-y-2">
              {groupConfigCounts === null ? (
                <p className="text-sm text-muted-foreground">无法读取分组明细</p>
              ) : groupConfigCounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无分组</p>
              ) : (
                <ul className="space-y-1">
                  {groupConfigCounts.map((g) => (
                    <li key={g.id} className="flex items-center justify-between text-sm">
                      <span className="truncate text-muted-foreground">{g.name}</span>
                      <span className="font-medium">{formatCount(g.configCount)}</span>
                    </li>
                  ))}
                  {groupsRemaining && groupsRemaining > 0 ? (
                    <li className="text-sm text-muted-foreground">还有 {groupsRemaining} 个分组…</li>
                  ) : null}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">通知统计</CardTitle>
            <Bell className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-semibold">{formatCount(totalNotifications)}</div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm text-muted-foreground">当前激活</span>
              <span className="text-sm font-medium text-orange-600">
                {formatCount(activeNotifications)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">快捷操作</CardTitle>
            <Wrench className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="sm:w-auto">
              <Link href="/protected/configs">
                <Plus className="size-4" />
                新增配置
              </Link>
            </Button>
            <Button asChild variant="secondary" className="sm:w-auto">
              <Link href="/protected/notifications">
                <Plus className="size-4" />
                新增通知
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
