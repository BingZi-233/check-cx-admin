import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, Trash2Icon } from "lucide-react"

import { deleteModelAction } from "@/app/dashboard/models/actions"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { ModelForm } from "@/components/admin/forms/model-form"
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
import { getModelById, listTemplates } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function EditModelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminUser()
  const { id } = await params

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="编辑模型"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  const [model, templates] = await Promise.all([
    getModelById(id),
    listTemplates(),
  ])

  if (!model) {
    notFound()
  }

  const configCount = model.config_count ?? 0

  return (
    <div className="space-y-4">
      <PageHeader
        title={`编辑：${model.model}`}
        description={`创建于 ${formatDateTime(model.created_at)}，更新于 ${formatDateTime(model.updated_at)}`}
        actions={
          <Button variant="outline" render={<Link href="/dashboard/models" />}>
            <ArrowLeftIcon />
            返回列表
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>模型内容</CardTitle>
          <CardDescription>
            当前有 {configCount} 条配置引用这个模型。被引用时不能删除。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModelForm model={model} templates={templates} />
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
              <Button type="button" variant="destructive" disabled={configCount > 0}>
                <Trash2Icon />
                删除模型
              </Button>
            }
            title="确认删除模型？"
            description={`将删除模型「${model.model}」。当前没有配置引用它，但删除后无法恢复。`}
            action={deleteModelAction}
            fields={{ id: model.id }}
            confirmLabel="确认删除"
            pendingLabel="删除中"
          />
        </CardContent>
      </Card>
    </div>
  )
}
