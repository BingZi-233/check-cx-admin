import Link from "next/link"
import { notFound } from "next/navigation"

import { deleteConfigAction, updateConfigAction } from "@/app/dashboard/configs/actions"
import { ConfigModelFields } from "@/components/admin/config-model-fields"
import { Notice } from "@/components/admin/notice"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDateTime } from "@/lib/admin/format"
import { getConfigById, listModels } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function EditConfigPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const query = await searchParams
  const error = getParam(query.error)
  const success = getParam(query.success)

  if (!hasAdminDatabaseEnv()) {
    return <PageHeader title="编辑配置" description="缺少 service role，这页不会工作。" />
  }

  const [config, models] = await Promise.all([getConfigById(id), listModels()])

  if (!config) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`编辑：${config.name}`}
        description={`创建于 ${formatDateTime(config.created_at)}，更新于 ${formatDateTime(config.updated_at)}`}
        actions={
          <Button variant="outline" render={<Link href="/dashboard/configs" />}>
            返回列表
          </Button>
        }
      />
      {success ? <Notice title="保存成功" description={success} variant="success" /> : null}
      {error ? <Notice title="保存失败" description={error} variant="warning" /> : null}
      <Card>
        <CardHeader>
          <CardTitle>编辑配置</CardTitle>
          <CardDescription>
            配置只保存连接信息。模板改动请去对应模型里处理。谨慎删除，`check_history` 会跟着一起被级联删掉。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateConfigAction} className="grid gap-5 md:grid-cols-2">
            <input type="hidden" name="id" value={config.id} />
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input id="name" name="name" defaultValue={config.name} required />
            </div>
            <ConfigModelFields
              initialType={config.type}
              initialModelId={config.model_id}
              models={models}
            />
            <div className="space-y-2">
              <Label htmlFor="group_name">分组名</Label>
              <Input id="group_name" name="group_name" defaultValue={config.group_name ?? ""} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endpoint">接口地址</Label>
              <Input id="endpoint" name="endpoint" defaultValue={config.endpoint} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input id="api_key" name="api_key" defaultValue={config.api_key} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolved_template">当前模板</Label>
              <Input id="resolved_template" defaultValue={config.template_name ?? "未绑定模板"} disabled />
            </div>
            <div className="flex items-center gap-6 pt-7 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="enabled" defaultChecked={Boolean(config.enabled)} />
                启用检测
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_maintenance"
                  defaultChecked={Boolean(config.is_maintenance)}
                />
                维护模式
              </label>
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Button type="submit">保存更改</Button>
              <Button variant="outline" render={<Link href="/dashboard/configs" />}>
                取消
              </Button>
            </div>
          </form>
          <form action={deleteConfigAction} className="mt-6 border-t pt-6">
            <input type="hidden" name="id" value={config.id} />
            <Button type="submit" variant="destructive">
              删除配置
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
