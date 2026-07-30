import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, EraserIcon, Trash2Icon } from "lucide-react"

import {
  clearConfigHistoryAction,
  deleteConfigAction,
} from "@/app/dashboard/configs/actions"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { ConfigForm } from "@/components/admin/forms/config-form"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireAppUser } from "@/lib/admin/auth"
import { formatDateTime } from "@/lib/admin/format"
import { isAdminUser } from "@/lib/admin/permissions"
import { getConfigById, listGroups, listSelectableModels } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function EditConfigPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAppUser()
  const adminUser = isAdminUser(user)
  const { id } = await params

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="编辑配置"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  const [config, models, groups] = await Promise.all([
    getConfigById(id, user),
    listSelectableModels(),
    adminUser ? listGroups() : Promise.resolve([]),
  ])

  if (!config) {
    notFound()
  }

  const groupNames = Array.from(
    new Set(
      groups
        .map((item) => item.group_name?.trim())
        .filter((item): item is string => Boolean(item))
    )
  ).sort((left, right) => left.localeCompare(right, "zh-Hans-CN"))

  return (
    <div className="space-y-4">
      <PageHeader
        title={`编辑：${config.name}`}
        description={`创建于 ${formatDateTime(config.created_at)}，更新于 ${formatDateTime(config.updated_at)}`}
        actions={
          <Button variant="outline" render={<Link href="/dashboard/configs" />}>
            <ArrowLeftIcon />
            返回列表
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>配置内容</CardTitle>
          <CardDescription>
            当前模板：{config.template_name ?? "未绑定模板"}。模板改动请去对应模型里处理。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigForm
            config={config}
            models={models}
            groupNames={groupNames}
            isAdmin={adminUser}
            memberGroupName={user.groupName}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>危险操作</CardTitle>
          <CardDescription>
            删除配置会级联删掉它在 `check_history` 里的检测历史。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <ConfirmActionDialog
            trigger={
              <Button type="button" variant="outline">
                <EraserIcon />
                清理请求历史
              </Button>
            }
            title="确认清理这条配置的请求历史？"
            description={`将清理配置「${config.name}」在 check_history 里的全部请求历史。配置本身不受影响。`}
            action={clearConfigHistoryAction}
            fields={{ id: config.id }}
            confirmLabel="确认清理"
            pendingLabel="清理中"
          />
          <ConfirmActionDialog
            trigger={
              <Button type="button" variant="destructive">
                <Trash2Icon />
                删除配置
              </Button>
            }
            title="确认删除这条配置？"
            description={`将删除配置「${config.name}」，它的检测历史会一起级联删除。这个操作不可恢复。`}
            action={deleteConfigAction}
            fields={{ id: config.id }}
            confirmLabel="确认删除"
            pendingLabel="删除中"
          />
        </CardContent>
      </Card>
    </div>
  )
}
