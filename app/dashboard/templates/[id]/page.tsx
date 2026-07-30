import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, Trash2Icon } from "lucide-react"

import { deleteTemplateAction } from "@/app/dashboard/templates/actions"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { TemplateForm } from "@/components/admin/forms/template-form"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireAdminUser } from "@/lib/admin/auth"
import { formatDateTime } from "@/lib/admin/format"
import { stringifyJson } from "@/lib/admin/json"
import { getTemplateById } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminUser()
  const { id } = await params

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="编辑模板"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  const template = await getTemplateById(id)

  if (!template) {
    notFound()
  }

  const modelCount = template.model_count ?? 0

  return (
    <div className="space-y-4">
      <PageHeader
        title={`编辑：${template.name}`}
        description={`创建于 ${formatDateTime(template.created_at)}，更新于 ${formatDateTime(template.updated_at)}`}
        actions={
          <Button variant="outline" render={<Link href="/dashboard/templates" />}>
            <ArrowLeftIcon />
            返回列表
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>模板内容</CardTitle>
          <CardDescription>
            当前有 {modelCount} 个模型引用这个模板。被引用时不能删除。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateForm
            template={template}
            requestHeaderText={stringifyJson(template.request_header)}
            metadataText={stringifyJson(template.metadata)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>危险操作</CardTitle>
          <CardDescription>删除后无法恢复。</CardDescription>
        </CardHeader>
        <CardContent>
          <ConfirmActionDialog
            trigger={
              <Button type="button" variant="destructive" disabled={modelCount > 0}>
                <Trash2Icon />
                删除模板
              </Button>
            }
            title="确认删除模板？"
            description={`将删除模板「${template.name}」。当前没有模型引用它，但删除后无法恢复。`}
            action={deleteTemplateAction}
            fields={{ id: template.id }}
            confirmLabel="确认删除"
            pendingLabel="删除中"
          />
        </CardContent>
      </Card>
    </div>
  )
}
