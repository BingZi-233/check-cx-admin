import Link from "next/link"

import { createModelAction } from "@/app/dashboard/models/actions"
import { ModelTemplateFields } from "@/components/admin/model-template-fields"
import { Notice } from "@/components/admin/notice"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { listTemplates } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

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

  const templates = await listTemplates()

  return (
    <div className="space-y-6">
      <PageHeader
        title="新建模型"
        description="模型层只管模型定义和绑定模板，不要把实例信息塞进来。"
        actions={<Button variant="outline" render={<Link href="/dashboard/models" />}>返回列表</Button>}
      />
      {error ? <Notice variant="warning" title="保存失败" description={error} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>模型表单</CardTitle>
          <CardDescription>模板是默认请求参数的唯一来源，模型只负责关联它。</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createModelAction} className="grid gap-4 md:grid-cols-2">
            <ModelTemplateFields initialType="openai" initialTemplateId="" templates={templates} />
            <label className="space-y-2">
              <span className="text-sm font-medium">模型名称</span>
              <Input name="model" placeholder="gpt-4o-mini" required />
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
