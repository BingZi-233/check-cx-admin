import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { ConfigForm } from "@/components/admin/forms/config-form"
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
import { requireAppUser } from "@/lib/admin/auth"
import { isAdminUser } from "@/lib/admin/permissions"
import { getConfigById, listGroups, listSelectableModels } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function NewConfigPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requireAppUser()
  const adminUser = isAdminUser(user)

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="新建配置"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  // ?source=<id> 是「复制为新配置」入口，用来预填表单
  const sourceId = getParam((await searchParams).source)

  const [groups, models, sourceConfig] = await Promise.all([
    adminUser ? listGroups() : Promise.resolve([]),
    listSelectableModels(),
    sourceId ? getConfigById(sourceId, user) : Promise.resolve(null),
  ])

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
        title="新建配置"
        description="填写检测实例的连接信息。请求参数默认值跟着模型绑定的模板走。"
        actions={
          <Button variant="outline" render={<Link href="/dashboard/configs" />}>
            <ArrowLeftIcon />
            返回列表
          </Button>
        }
      />
      {sourceConfig ? (
        <Notice
          variant="info"
          title="正在复制已有配置"
          description={`已从「${sourceConfig.name}」预填表单，请确认差异后再创建。`}
        />
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>配置表单</CardTitle>
          <CardDescription>
            配置只保存连接信息和运行状态，模板改动请去对应模型里处理。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigForm
            models={models}
            groupNames={groupNames}
            isAdmin={adminUser}
            memberGroupName={user.groupName}
            sourceConfig={sourceConfig ?? undefined}
          />
        </CardContent>
      </Card>
    </div>
  )
}
