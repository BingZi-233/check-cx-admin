import Link from "next/link"
import { notFound } from "next/navigation"

import { deleteModelAction, updateModelAction } from "@/app/dashboard/models/actions"
import { ModelTemplateFields } from "@/components/admin/model-template-fields"
import { Notice } from "@/components/admin/notice"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatDateTime } from "@/lib/admin/format"
import { getModelById, listTemplates } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function EditModelPage({
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
    return <PageHeader title="编辑模型" description="缺少 service role，这页不会工作。" />
  }

  const [model, templates] = await Promise.all([getModelById(id), listTemplates()])

  if (!model) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`编辑：${model.model}`}
        description={`创建于 ${formatDateTime(model.created_at)}，更新于 ${formatDateTime(model.updated_at)}`}
        actions={
          <Button variant="outline" render={<Link href="/dashboard/models" />}>
            返回列表
          </Button>
        }
      />
      {success ? <Notice title="保存成功" description={success} variant="success" /> : null}
      {error ? <Notice title="保存失败" description={error} variant="warning" /> : null}
      <Card>
        <CardHeader>
          <CardTitle>模型内容</CardTitle>
          <CardDescription>
            当前有 {model.config_count ?? 0} 条配置引用这个模型。被引用时不能删除。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateModelAction} className="grid gap-5">
            <input type="hidden" name="id" value={model.id} />
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <span className="text-sm font-medium">模型名称</span>
                <Input id="model" name="model" defaultValue={model.model} required />
              </div>
              <ModelTemplateFields
                initialType={model.type}
                initialTemplateId={model.template_id ?? ""}
                templates={templates}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit">保存更改</Button>
              <Button variant="outline" render={<Link href="/dashboard/models" />}>
                取消
              </Button>
            </div>
          </form>
          <form action={deleteModelAction} className="mt-6 border-t pt-6">
            <input type="hidden" name="id" value={model.id} />
            <Button type="submit" variant="destructive" disabled={(model.config_count ?? 0) > 0}>
              删除模型
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
