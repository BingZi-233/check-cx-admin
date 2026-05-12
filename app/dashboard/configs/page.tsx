import Link from "next/link"
import { PlusIcon } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { requireAppUser } from "@/lib/admin/auth"
import { nativeSelectClassName } from "@/lib/admin/forms"
import { listConfigs, listSelectableModels, listTemplates } from "@/lib/admin/queries"
import { isAdminUser } from "@/lib/admin/permissions"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

import { ConfigsTable } from "./configs-table"

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ConfigsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requireAppUser()
  const adminUser = isAdminUser(user)
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
        <PageHeader title="Provider 配置" description="缺少 service role 凭据，当前页面暂不可用。" />
      </div>
    )
  }

  const [configs, templates, models] = await Promise.all([
    listConfigs(user),
    listTemplates(user),
    listSelectableModels(),
  ])
  const groupNames = Array.from(
    new Set(
      configs
        .map((item) => item.group_name?.trim())
        .filter((item): item is string => Boolean(item))
    )
  ).sort((left, right) => left.localeCompare(right, "zh-Hans-CN"))

  const normalizedKeyword = keyword.toLowerCase()
  const filteredConfigs = configs.filter((item) => {
    const templateName = item.template_name ?? ""
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
  const returnPath = (() => {
    const search = new URLSearchParams()

    if (keyword) {
      search.set("keyword", keyword)
    }

    if (type) {
      search.set("type", type)
    }

    if (groupName) {
      search.set("group_name", groupName)
    }

    if (templateId) {
      search.set("template_id", templateId)
    }

    if (enabled) {
      search.set("enabled", enabled)
    }

    if (maintenance) {
      search.set("maintenance", maintenance)
    }

    const query = search.toString()
    return query.length > 0 ? `/dashboard/configs?${query}` : "/dashboard/configs"
  })()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Provider 配置"
        description={
          adminUser
            ? "管理实际参与检测的实例，优先通过启停维护运行状态。"
            : `这里只能维护分组「${user.groupName}」下的配置。`
        }
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
              ? `共 ${configs.length} 条，筛选后 ${filteredConfigs.length} 条。模板来源已经上收到了模型层。`
              : `共 ${configs.length} 条。模板来源已经上收到了模型层。`}
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
              <select name="type" defaultValue={type} className={nativeSelectClassName}>
                <option value="">全部</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">分组</span>
              {adminUser ? (
                <select name="group_name" defaultValue={groupName} className={nativeSelectClassName}>
                  <option value="">全部</option>
                  {groupNames.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <Input value={user.groupName ?? ""} disabled />
              )}
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">模板</span>
              <select name="template_id" defaultValue={templateId} className={nativeSelectClassName}>
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
              <select name="enabled" defaultValue={enabled} className={nativeSelectClassName}>
                <option value="">全部</option>
                <option value="enabled">启用</option>
                <option value="disabled">停用</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">维护状态</span>
              <select name="maintenance" defaultValue={maintenance} className={nativeSelectClassName}>
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
          <ConfigsTable
            configs={filteredConfigs}
            models={models}
            returnPath={returnPath}
          />
        </CardContent>
      </Card>
    </div>
  )
}
