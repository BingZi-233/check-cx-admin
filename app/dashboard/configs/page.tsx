import Link from "next/link"
import { CopyIcon, PlusIcon } from "lucide-react"

import { Notice } from "@/components/admin/notice"
import { PageHeader } from "@/components/admin/page-header"
import { BooleanBadge, ProviderBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateTime, maskSecret } from "@/lib/admin/format"
import { listConfigs, listTemplates } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function ConfigsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const success = Array.isArray(params.success) ? params.success[0] : params.success
  const error = Array.isArray(params.error) ? params.error[0] : params.error

  if (!hasAdminDatabaseEnv()) {
    return (
      <div className="space-y-6">
        <PageHeader title="Provider 配置" description="缺少 service role 之前，别指望这页能动。" />
      </div>
    )
  }

  const [configs, templates] = await Promise.all([listConfigs(), listTemplates()])
  const templateMap = new Map(templates.map((item) => [item.id, item.name]))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Provider 配置"
        description="管理真正参与检测的实例。默认优先停用，不要手滑删除。"
        actions={
          <Button render={<Link href="/dashboard/configs/new" />}>
            <PlusIcon />
            新建配置
          </Button>
        }
      />
      {success ? <Notice variant="success" title="操作成功" description={success} /> : null}
      {error ? <Notice variant="warning" title="操作失败" description={error} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>配置列表</CardTitle>
          <CardDescription>共 {configs.length} 条。模板、分组、维护态都直接在这里收口。</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 pr-4">名称</th>
                <th className="py-3 pr-4">Provider</th>
                <th className="py-3 pr-4">模型</th>
                <th className="py-3 pr-4">分组</th>
                <th className="py-3 pr-4">模板</th>
                <th className="py-3 pr-4">状态</th>
                <th className="py-3 pr-4">Key</th>
                <th className="py-3">更新时间</th>
                <th className="py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((item) => (
                <tr key={item.id} className="border-b align-top last:border-0">
                  <td className="py-3 pr-4">
                    <Link href={`/dashboard/configs/${item.id}`} className="font-medium hover:underline">
                      {item.name}
                    </Link>
                    <div className="mt-1 max-w-md break-all text-xs text-muted-foreground">{item.endpoint}</div>
                  </td>
                  <td className="py-3 pr-4"><ProviderBadge type={item.type} /></td>
                  <td className="py-3 pr-4">{item.model}</td>
                  <td className="py-3 pr-4">{item.group_name || "-"}</td>
                  <td className="py-3 pr-4">{item.template_id ? templateMap.get(item.template_id) ?? item.template_id : "-"}</td>
                  <td className="py-3 pr-4 space-x-2">
                    <BooleanBadge active={Boolean(item.enabled)} trueLabel="启用" falseLabel="停用" />
                    <BooleanBadge active={Boolean(item.is_maintenance)} trueLabel="维护中" falseLabel="非维护" />
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">{maskSecret(item.api_key)}</td>
                  <td className="py-3">{formatDateTime(item.updated_at)}</td>
                  <td className="py-3 text-right">
                    <Button
                      variant="outline"
                      render={<Link href={`/dashboard/configs/new?source=${item.id}`} />}
                    >
                      <CopyIcon />
                      复制
                    </Button>
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
