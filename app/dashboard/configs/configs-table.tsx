"use client"

import Link from "next/link"
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { CopyIcon } from "lucide-react"

import { batchConfigAction } from "@/app/dashboard/configs/actions"
import { BooleanBadge, ProviderBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { formatDate, formatDateTime, maskSecret } from "@/lib/admin/format"
import type { CheckConfigRecord } from "@/lib/admin/types"

type ConfigsTableProps = {
  configs: CheckConfigRecord[]
  returnPath: string
}

function formatTemplateLabel(value: string) {
  const chars = Array.from(value)
  return chars.length > 10 ? `${chars.slice(0, 10).join("")}...` : value
}

export function ConfigsTable({ configs, returnPath }: ConfigsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const selectAllRef = useRef<HTMLInputElement>(null)
  const configIds = useMemo(() => configs.map((item) => item.id), [configs])
  const configIdSet = useMemo(() => new Set(configIds), [configIds])
  const visibleSelectedIds = useMemo(
    () => selectedIds.filter((id) => configIdSet.has(id)),
    [configIdSet, selectedIds]
  )
  const visibleSelectedSet = useMemo(() => new Set(visibleSelectedIds), [visibleSelectedIds])

  useEffect(() => {
    if (!selectAllRef.current) {
      return
    }

    const allSelected = configs.length > 0 && visibleSelectedIds.length === configs.length
    const someSelected = visibleSelectedIds.length > 0 && !allSelected
    selectAllRef.current.indeterminate = someSelected
  }, [configs.length, visibleSelectedIds])

  const allSelected = configs.length > 0 && visibleSelectedIds.length === configs.length
  const hasSelection = visibleSelectedIds.length > 0

  function toggleConfig(id: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id]
      }

      return current.filter((item) => item !== id)
    })
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? configIds : [])
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nativeEvent = event.nativeEvent as SubmitEvent
    const submitter = nativeEvent.submitter

    if (!(submitter instanceof HTMLButtonElement)) {
      return
    }

    if (submitter.value === "delete") {
      const confirmed = window.confirm(`确定删除选中的 ${visibleSelectedIds.length} 条配置吗？相关检测历史会一起被级联删除。`)

      if (!confirmed) {
        event.preventDefault()
      }
    }
  }

  return (
    <form action={batchConfigAction} onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="return_to" value={returnPath} />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 p-3">
        <div className="text-sm text-muted-foreground">
          {hasSelection
            ? `已选 ${visibleSelectedIds.length} 条。批量操作只打在这批配置上。`
            : "先勾选配置，再做批量启停、维护切换或删除。"}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" name="operation" value="enable" variant="outline" disabled={!hasSelection}>
            批量启用
          </Button>
          <Button type="submit" name="operation" value="disable" variant="outline" disabled={!hasSelection}>
            批量停用
          </Button>
          <Button
            type="submit"
            name="operation"
            value="maintenance_on"
            variant="outline"
            disabled={!hasSelection}
          >
            批量维护
          </Button>
          <Button
            type="submit"
            name="operation"
            value="maintenance_off"
            variant="outline"
            disabled={!hasSelection}
          >
            取消维护
          </Button>
          <Button
            type="submit"
            name="operation"
            value="delete"
            variant="destructive"
            disabled={!hasSelection}
          >
            批量删除
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1320px] table-fixed text-left text-sm">
          <colgroup>
            <col style={{ width: "44px" }} />
            <col style={{ width: "20%" }} />
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
              <th className="py-3 pr-2 text-center">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  aria-label="全选当前列表"
                  checked={allSelected}
                  onChange={(event) => toggleAll(event.target.checked)}
                />
              </th>
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
            {configs.length > 0 ? (
              configs.map((item) => (
                <tr key={item.id} className="border-b align-top last:border-0">
                  <td className="py-3 pr-2 text-center">
                    <input
                      type="checkbox"
                      name="ids"
                      value={item.id}
                      aria-label={`选中 ${item.name}`}
                      checked={visibleSelectedSet.has(item.id)}
                      onChange={(event) => toggleConfig(item.id, event.target.checked)}
                    />
                  </td>
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
                      title={item.template_name ?? "-"}
                    >
                      {item.template_name ? formatTemplateLabel(item.template_name) : "-"}
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
                <td colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                  没有匹配的配置。把筛选条件收一收，别把自己也筛没了。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </form>
  )
}
