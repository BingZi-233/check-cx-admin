import { GroupsTable } from "@/app/dashboard/groups/groups-table"
import { PageHeader } from "@/components/admin/page-header"
import { requireAdminUser } from "@/lib/admin/auth"
import { listGroups } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function GroupsPage() {
  await requireAdminUser()

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="分组信息"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  const groups = await listGroups()

  return (
    <div className="space-y-4">
      <PageHeader
        title="分组信息"
        description="维护前台展示所需的分组元数据。分组和 check_configs.group_name 是文本关联，改名前先确认引用它的配置。"
      />
      <GroupsTable groups={groups} />
    </div>
  )
}
