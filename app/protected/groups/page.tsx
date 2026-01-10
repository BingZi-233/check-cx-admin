import { createClient } from "@/lib/supabase/server"
import { GroupsClient } from "@/app/protected/groups/groups-client"

type GroupInfoRow = {
  id: string
  group_name: string
  website_url: string | null
  created_at: string | null
  updated_at: string | null
}

async function getConfigCountsByGroupId(groupIds: string[]) {
  const table = process.env.GROUP_CONFIG_TABLE ?? "check_config"
  const fkColumn = process.env.GROUP_CONFIG_FK_COLUMN ?? "group_id"
  if (!groupIds.length) return {}

  const supabase = await createClient()
  const entries = await Promise.all(
    groupIds.map(async (groupId) => {
      const { count, error } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq(fkColumn, groupId)

      if (error) return [groupId, null] as const
      return [groupId, count ?? 0] as const
    })
  )

  return Object.fromEntries(entries) as Record<string, number | null>
}

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: groups, error } = await supabase
    .from("group_info")
    .select("id, group_name, website_url, created_at, updated_at")
    .order("created_at", { ascending: false })

  const safeGroups = (groups ?? []) as GroupInfoRow[]
  const configCountsByGroupId = await getConfigCountsByGroupId(
    safeGroups.map((g) => g.id)
  )

  return (
    <GroupsClient
      groups={safeGroups}
      configCountsByGroupId={configCountsByGroupId}
      loadError={error?.message ?? null}
    />
  )
}

