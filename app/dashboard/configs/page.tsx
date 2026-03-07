import Link from "next/link"
import { CopyIcon, PlusIcon } from "lucide-react"

import { Notice } from "@/components/admin/notice"
import { PageHeader } from "@/components/admin/page-header"
import { BooleanBadge, ProviderBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatDate, formatDateTime, maskSecret } from "@/lib/admin/format"
import { listConfigs, listTemplates } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

const selectClassName = "flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function formatTemplateLabel(value: string) {
  const chars = Array.from(value)
  return chars.length > 10 ? `${chars.slice(0, 10).join("")}...` : value
}

export default async function ConfigsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const success = getParam(params.success)
  const error = getParam(params.error)
  const keyword = getParam(params.keyword)?.trim() ?? ""
  const type = getParam(params.type) ?? ""
  const groupName = getParam(params.group_name) ?? ""
  const templateId = getParam(params.template_id) ?? ""
  const enabled = getParam(params.enabled) ?? ""
  const maintenance = getParam(params.maintenance) ?? ""

  if (!hasAdminDatabaseEnv()) {
    return (
      <div className="space-y-6">
        <PageHeader title="Provider 配置" description="缺少 service role 之前，别指望这页能动。" />
      </div>
    )
  }

  const [configs, templates] = await Promise.all([listConfigs(), listTemplates()])
  const templateMap = new Map(templates.map((item) => [item.id, item.name]))
  const groupNames = Array.from(
    new Set(configs.map((item) => item.group_name?.trim()).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right, "zh-Hans-CN"))

  const normalizedKeyword = keyword.toLowerCase()
  const filteredConfigs = configs.filter((item) => {
    const templateName = item.template_id ? templateMap.get(item.template_id) ?? item.template_id : ""
    const matchesKeyword =
      normalizedKeyword.length === 0 ||
      [item.name, item.model, item.endpoint, item.group_name ?? "", templateName]
        .join("\n")
        .toLowerCase()
        .includes(normalizedKeyword)

    const matchesType = type.length === 0 || item.type === type
    const matchesGroup = groupName.length === 0 || (item.group_name ?? "") === groupName
    const matchesTemplate =
      templateId.length === 0 ||
      (templateId === "__none__" ? !item.template_id : item.template_id === templateId)
    const matchesEnabled =
      enabled.length === 0 ||
      (enabled === "enabled" ? Boolean(item.enabled) : !Boolean(item.enabled))
    const matchesMaintenance =
      maintenance.length === 0 ||
      (maintenance === "maintenance" ? Boolean(item.is_maintenance) : !Boolean(item.is_maintenance))

    return (
      matchesKeyword &&
      matchesType &&
      matchesGroup &&
      matchesTemplate &&
      matchesEnabled &&
      matchesMaintenance
    )
  }).sort((left, right) => {
    const leftCreatedAt = left.created_at ? new Date(left.created_at).getTime() : 0
    const rightCreatedAt = right.created_at ? new Date(right.created_at).getTime() : 0

    if (rightCreatedAt !== leftCreatedAt) {
      return rightCreatedAt - leftCreatedAt
    }

    const leftUpdatedAt = left.updated_at ? new Date(left.updated_at).getTime() : 0
    const rightUpdatedAt = right.updated_at ? new Date(right.updated_at).getTime() : 0

    return rightUpdatedAt - leftUpdatedAt
  })

  const hasActiveFilters = [keyword, type, groupName, templateId, enabled, maintenance].some(
    (value) => value.length > 0
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Provider 配置"
        description="管理真正参与检测的实例。默认优先停用，不要手滑删除。"
        actions={
          <Button render={<Link href="/dashboard/configs/new" />}>
            <PlusIcon />
            新建配置
          </Button>
        }
      />
      {success ? <Notice variant="success" title="操作成功" description={success} /> : null}
      {error ? <Notice variant="warning" title="操作失败" description={error} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>配置列表</CardTitle>
          <CardDescription>
            {hasActiveFilters
              ? `共 ${configs.length} 条，筛选后 ${filteredConfigs.length} 条。模板、分组、维护态都直接在这里收口。`
              : `共 ${configs.length} 条。模板、分组、维护态都直接在这里收口。`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-2">
              <span className="text-sm font-medium">关键词</span>
              <Input
                name="keyword"
                defaultValue={keyword}
                placeholder="名称 / 模型 / 地址 / 分组 / 模板"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Provider</span>
              <select name="type" defaultValue={type} className={selectClassName}>
                <option value="">全部</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">分组</span>
              <select name="group_name" defaultValue={groupName} className={selectClassName}>
                <option value="">全部</option>
                {groupNames.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">模板</span>
              <select name="template_id" defaultValue={templateId} className={selectClassName}>
                <option value="">全部</option>
                <option value="__none__">无模板</option>
                {templates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">启用状态</span>
              <select name="enabled" defaultValue={enabled} className={selectClassName}>
                <option value="">全部</option>
                <option value="enabled">启用</option>
                <option value="disabled">停用</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">维护状态</span>
              <select name="maintenance" defaultValue={maintenance} className={selectClassName}>
                <option value="">全部</option>
                <option value="maintenance">维护中</option>
                <option value="normal">非维护</option>
              </select>
            </label>
            <div className="flex items-end gap-3 md:col-span-2 xl:col-span-6">
              <Button type="submit">筛选</Button>
              <Button variant="outline" render={<Link href="/dashboard/configs" />}>
                清空筛选
              </Button>
            </div>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1260px] table-fixed text-left text-sm">
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "96px" }} />
              </colgroup>
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="py-3 pr-4">名称</th>
                  <th className="py-3 pr-4">Provider</th>
                  <th className="py-3 pr-4">模型</th>
                  <th className="py-3 pr-4">分组</th>
                  <th className="py-3 pr-4">模板</th>
                  <th className="py-3 pr-4">状态</th>
                  <th className="py-3 pr-4">Key</th>
                  <th className="py-3">更新时间</th>
                  <th className="py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredConfigs.length > 0 ? (
                  filteredConfigs.map((item) => (
                    <tr key={item.id} className="border-b align-top last:border-0">
                      <td className="py-3 pr-4">
                        <Link href={`/dashboard/configs/${item.id}`} className="font-medium hover:underline">
                          {item.name}
                        </Link>
                        <div className="mt-1 line-clamp-2 break-all text-xs text-muted-foreground" title={item.endpoint}>
                          {item.endpoint}
                        </div>
                      </td>
                      <td className="py-3 pr-4"><ProviderBadge type={item.type} /></td>
                      <td className="py-3 pr-4">
                        <div className="truncate" title={item.model}>
                          {item.model}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="truncate" title={item.group_name || "-"}>
                          {item.group_name || "-"}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div
                          className="truncate"
                          title={item.template_id ? templateMap.get(item.template_id) ?? item.template_id : "-"}
                        >
                          {item.template_id
                            ? formatTemplateLabel(templateMap.get(item.template_id) ?? item.template_id)
                            : "-"}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <BooleanBadge active={Boolean(item.enabled)} trueLabel="启用" falseLabel="停用" />
                          <BooleanBadge active={Boolean(item.is_maintenance)} trueLabel="维护中" falseLabel="非维护" />
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs">
                        <div className="truncate" title={maskSecret(item.api_key)}>
                          {maskSecret(item.api_key)}
                        </div>
                      </td>
                      <td className="py-3" title={formatDateTime(item.updated_at)}>{formatDate(item.updated_at)}</td>
                      <td className="py-3">
                        <Button
                          variant="outline"
                          render={<Link href={`/dashboard/configs/new?source=${item.id}`} />}
                        >
                          <CopyIcon />
                          复制
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                      没有匹配的配置。把筛选条件收一收，别把自己也筛没了。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
