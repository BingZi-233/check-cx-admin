import Link from "next/link"

import { createModelAction } from "@/app/dashboard/models/actions"
import { Notice } from "@/components/admin/notice"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

const selectClassName = "flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"

export default async function NewModelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const error = Array.isArray(params.error) ? params.error[0] : params.error

  if (!hasAdminDatabaseEnv()) {
    return <PageHeader title="新建模型" description="先配 service role。" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="新建模型"
        description="模型层只管模型定义和模型级默认参数，不要把实例信息塞进来。"
        actions={<Button variant="outline" render={<Link href="/dashboard/models" />}>返回列表</Button>}
      />
      {error ? <Notice variant="warning" title="保存失败" description={error} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>模型表单</CardTitle>
          <CardDescription>请求头和 metadata 都是可选 JSON。</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createModelAction} className="grid gap-4 md:grid-cols-2">
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
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">请求头 JSON</span>
              <Textarea name="request_header" className="min-h-36 font-mono" placeholder='{"Authorization":"Bearer ..."}' />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">metadata JSON</span>
              <Textarea name="metadata" className="min-h-36 font-mono" placeholder='{"temperature":0}' />
            </label>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" render={<Link href="/dashboard/models" />}>取消</Button>
              <Button type="submit">创建模型</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

