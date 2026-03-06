import Link from "next/link"

import { Notice } from "@/components/admin/notice"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { listTemplates } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"
import { createConfigAction } from "@/app/dashboard/configs/actions"

const selectClassName = "flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"

export default async function NewConfigPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const error = Array.isArray(params.error) ? params.error[0] : params.error

  if (!hasAdminDatabaseEnv()) {
    return <PageHeader title="新建配置" description="先配 service role，不然新增只是幻觉。" />
  }

  const templates = await listTemplates()

  return (
    <div className="space-y-6">
      <PageHeader
        title="新建配置"
        description="把检测实例写清楚。特殊情况越少，后面越省心。"
        actions={<Button variant="outline" render={<Link href="/dashboard/configs" />}>返回列表</Button>}
      />
      {error ? <Notice variant="warning" title="保存失败" description={error} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>配置表单</CardTitle>
          <CardDescription>JSON 字段留空即可，填了就必须是合法 JSON。</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createConfigAction} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">显示名称</span>
              <Input name="name" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Provider 类型</span>
              <select name="type" defaultValue="openai" className={selectClassName}>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">模型名称</span>
              <Input name="model" placeholder="gpt-4o-mini" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">分组名称</span>
              <Input name="group_name" placeholder="OpenAI" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">API 端点</span>
              <Input name="endpoint" placeholder="https://api.openai.com/v1/chat/completions" required />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">API Key</span>
              <Input name="api_key" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">请求模板</span>
              <select name="template_id" defaultValue="" className={selectClassName}>
                <option value="">不使用模板</option>
                {templates.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} · {item.type}</option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-6 pt-7 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="enabled" defaultChecked /> 启用检测</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="is_maintenance" /> 维护模式</label>
            </div>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">请求头 JSON</span>
              <Textarea name="request_header" placeholder='{"Authorization":"Bearer ..."}' className="min-h-32 font-mono" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">metadata JSON</span>
              <Textarea name="metadata" placeholder='{"temperature":0}' className="min-h-32 font-mono" />
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
