import { ConfigsTable } from "@/app/dashboard/configs/configs-table"
import { PageHeader } from "@/components/admin/page-header"
import { requireAppUser } from "@/lib/admin/auth"
import { isAdminUser } from "@/lib/admin/permissions"
import { listConfigs, listGroups, listSelectableModels } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function ConfigsPage() {
  const user = await requireAppUser()
  const adminUser = isAdminUser(user)

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="Provider 配置"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  const [configs, models, groups] = await Promise.all([
    listConfigs(user),
    listSelectableModels(),
    adminUser ? listGroups() : Promise.resolve([]),
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
        title="Provider 配置"
        description={
          adminUser
            ? `共 ${configs.length} 条。请求参数默认值跟着模型绑定的模板走，这里只维护连接信息和运行状态。`
            : `只能维护分组「${user.groupName}」下的配置，共 ${configs.length} 条。`
        }
      />
      <ConfigsTable
        configs={configs}
        models={models}
        isAdmin={adminUser}
        groupNames={groupNames}
        memberGroupName={user.groupName}
      />
    </div>
  )
}
