import Link from "next/link"
import { notFound } from "next/navigation"

import { deleteTemplateAction, updateTemplateAction } from "@/app/dashboard/templates/actions"
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
import { Textarea } from "@/components/ui/textarea"
import { formatDateTime } from "@/lib/admin/format"
import { stringifyJson } from "@/lib/admin/json"
import { getTemplateById } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function EditTemplatePage({
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
    return <PageHeader title="编辑模板" description="缺少 service role，这页不会工作。" />
  }

  const template = await getTemplateById(id)

  if (!template) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`编辑：${template.name}`}
        description={`创建于 ${formatDateTime(template.created_at)}，更新于 ${formatDateTime(template.updated_at)}`}
        actions={
          <Button variant="outline" render={<Link href="/dashboard/templates" />}>
            返回列表
          </Button>
        }
      />
      {success ? <Notice title="保存成功" description={success} variant="success" /> : null}
      {error ? <Notice title="保存失败" description={error} variant="warning" /> : null}
      <Card>
        <CardHeader>
          <CardTitle>模板内容</CardTitle>
          <CardDescription>
            当前有 {template.model_count ?? 0} 个模型引用这个模板。被引用时不能删除。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateTemplateAction} className="grid gap-5">
            <input type="hidden" name="id" value={template.id} />
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">模板名称</Label>
                <Input id="name" name="name" defaultValue={template.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Provider 类型</Label>
                <select
                  id="type"
                  name="type"
                  className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                  defaultValue={template.type}
                >
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Gemini</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="request_header">默认请求头 JSON</Label>
              <Textarea
                id="request_header"
                name="request_header"
                rows={10}
                defaultValue={stringifyJson(template.request_header)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metadata">默认 metadata JSON</Label>
              <Textarea
                id="metadata"
                name="metadata"
                rows={10}
                defaultValue={stringifyJson(template.metadata)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit">保存更改</Button>
              <Button variant="outline" render={<Link href="/dashboard/templates" />}>
                取消
              </Button>
            </div>
          </form>
          <form action={deleteTemplateAction} className="mt-6 border-t pt-6">
            <input type="hidden" name="id" value={template.id} />
            <Button type="submit" variant="destructive" disabled={(template.model_count ?? 0) > 0}>
              删除模板
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
