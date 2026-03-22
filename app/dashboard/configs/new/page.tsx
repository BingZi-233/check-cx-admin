import Link from "next/link"

import { Notice } from "@/components/admin/notice"
import { ConfigModelFields } from "@/components/admin/config-model-fields"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getConfigById, listGroups, listModels, listTemplates } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"
import { createConfigAction } from "@/app/dashboard/configs/actions"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function NewConfigPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const error = getParam(params.error)
  const sourceId = getParam(params.source)

  if (!hasAdminDatabaseEnv()) {
    return <PageHeader title="新建配置" description="先配 service role，不然新增只是幻觉。" />
  }

  const [templates, groups, models, sourceConfig] = await Promise.all([
    listTemplates(),
    listGroups(),
    listModels(),
    sourceId ? getConfigById(sourceId) : Promise.resolve(null),
  ])

  const groupNames = Array.from(new Set(groups.map((item) => item.group_name).filter(Boolean))).sort(
    (left, right) => left.localeCompare(right, "zh-Hans-CN")
  )
  const sourceGroupName = sourceConfig?.group_name?.trim() || ""
  const hasSourceGroup = sourceGroupName.length > 0 && groupNames.includes(sourceGroupName)

  return (
    <div className="space-y-6">
      <PageHeader
        title="新建配置"
        description="把检测实例写清楚。特殊情况越少，后面越省心。"
        actions={<Button variant="outline" render={<Link href="/dashboard/configs" />}>返回列表</Button>}
      />
      {error ? <Notice variant="warning" title="保存失败" description={error} /> : null}
      {sourceConfig ? (
        <Notice
          variant="info"
          title="正在复制已有配置"
          description={`已从「${sourceConfig.name}」预填表单，改完再创建，别直接把旧配置覆盖了。`}
        />
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>配置表单</CardTitle>
          <CardDescription>JSON 字段留空即可，填了就必须是合法 JSON。</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createConfigAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="source_config_id" value={sourceConfig?.id ?? sourceId ?? ""} />
            <label className="space-y-2">
              <span className="text-sm font-medium">显示名称</span>
              <Input name="name" defaultValue={sourceConfig ? `${sourceConfig.name} - 副本` : ""} required />
            </label>
            <ConfigModelFields
              initialType={sourceConfig?.type ?? "openai"}
              initialModelId={sourceConfig?.model_id ?? ""}
              models={models}
            />
            <label className="space-y-2">
              <span className="text-sm font-medium">分组名称</span>
              <select name="group_name" defaultValue={sourceGroupName} className="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30">
                <option value="">不设置分组</option>
                {!hasSourceGroup && sourceGroupName ? (
                  <option value={sourceGroupName}>{sourceGroupName}（当前未在分组表中）</option>
                ) : null}
                {groupNames.map((groupName) => (
                  <option key={groupName} value={groupName}>{groupName}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">API 端点</span>
              <Input name="endpoint" placeholder="https://api.openai.com/v1/chat/completions" defaultValue={sourceConfig?.endpoint ?? ""} required />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">API Key</span>
              <Input name="api_key" defaultValue={sourceConfig?.api_key ?? ""} required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">请求模板</span>
              <select name="template_id" defaultValue={sourceConfig?.template_id ?? ""} className="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30">
                <option value="">不使用模板</option>
                {templates.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} · {item.type}</option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-6 pt-7 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="enabled" defaultChecked={sourceConfig ? Boolean(sourceConfig.enabled) : true} /> 启用检测</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="is_maintenance" defaultChecked={Boolean(sourceConfig?.is_maintenance)} /> 维护模式</label>
            </div>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">请求头 JSON</span>
              <Textarea name="request_header" placeholder='{"Authorization":"Bearer ..."}' className="min-h-32 font-mono" defaultValue={sourceConfig?.request_header ? JSON.stringify(sourceConfig.request_header, null, 2) : ""} />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">metadata JSON</span>
              <Textarea name="metadata" placeholder='{"temperature":0}' className="min-h-32 font-mono" defaultValue={sourceConfig?.metadata ? JSON.stringify(sourceConfig.metadata, null, 2) : ""} />
            </label>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" render={<Link href="/dashboard/configs" />}>取消</Button>
              <Button type="submit">创建配置</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
