"use client"

import Link from "next/link"
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { CopyIcon, EraserIcon, ShuffleIcon } from "lucide-react"

import { batchConfigAction, clearConfigHistoryAction } from "@/app/dashboard/configs/actions"
import { BooleanBadge, ProviderBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatDate, formatDateTime, maskSecret } from "@/lib/admin/format"
import type { CheckConfigRecord, CheckModelRecord, ProviderType } from "@/lib/admin/types"

type ConfigsTableProps = {
  configs: CheckConfigRecord[]
  models: CheckModelRecord[]
  returnPath: string
}

function formatTemplateLabel(value: string) {
  const chars = Array.from(value)
  return chars.length > 10 ? `${chars.slice(0, 10).join("")}...` : value
}

function getSingleProviderType(configs: CheckConfigRecord[], selectedIds: string[]): ProviderType | null {
  const selectedTypes = Array.from(
    new Set(
      configs
        .filter((item) => selectedIds.includes(item.id))
        .map((item) => item.type)
    )
  )

  return selectedTypes.length === 1 ? selectedTypes[0] : null
}

export function ConfigsTable({ configs, models, returnPath }: ConfigsTableProps) {
  const formId = "batch-config-form"
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isReplaceModelOpen, setIsReplaceModelOpen] = useState(false)
  const [targetModelId, setTargetModelId] = useState("")
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
  const selectedProviderType = useMemo(
    () => getSingleProviderType(configs, visibleSelectedIds),
    [configs, visibleSelectedIds]
  )
  const filteredModels = useMemo(
    () => (selectedProviderType ? models.filter((item) => item.type === selectedProviderType) : []),
    [models, selectedProviderType]
  )
  const hasMixedTypes = hasSelection && !selectedProviderType
  const resolvedTargetModelId = useMemo(() => {
    if (!selectedProviderType) {
      return ""
    }

    if (targetModelId && filteredModels.some((item) => item.id === targetModelId)) {
      return targetModelId
    }

    return filteredModels[0]?.id ?? ""
  }, [filteredModels, selectedProviderType, targetModelId])

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

    if (submitter.value === "replace_model" && !resolvedTargetModelId) {
      event.preventDefault()
    }
  }

  return (
    <form id={formId} action={batchConfigAction} onSubmit={handleSubmit} className="space-y-4">
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
            type="button"
            variant="outline"
            disabled={!hasSelection}
            onClick={() => {
              setTargetModelId(resolvedTargetModelId)
              setIsReplaceModelOpen(true)
            }}
          >
            <ShuffleIcon />
            批量换模型
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button type="button" variant="destructive" disabled={!hasSelection} />}
            >
              批量清理历史
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认批量清理请求历史？</AlertDialogTitle>
                <AlertDialogDescription>
                  将清理选中的 {visibleSelectedIds.length} 条配置在 `check_history` 里的全部请求历史。
                  这不会删除配置本身，但历史记录不可恢复。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  type="submit"
                  form={formId}
                  name="operation"
                  value="clear_history"
                  variant="destructive"
                  disabled={!hasSelection}
                >
                  确认清理
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button type="button" variant="destructive" disabled={!hasSelection} />}
            >
              批量删除
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认批量删除配置？</AlertDialogTitle>
                <AlertDialogDescription>
                  将删除选中的 {visibleSelectedIds.length} 条配置，相关检测历史也会一起被级联删除。
                  这个操作不可恢复。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  type="submit"
                  form={formId}
                  name="operation"
                  value="delete"
                  variant="destructive"
                  disabled={!hasSelection}
                >
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
            <col style={{ width: "180px" }} />
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
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        render={<Link href={`/dashboard/configs/new?source=${item.id}`} />}
                      >
                        <CopyIcon />
                        复制
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
                          <EraserIcon />
                          清理历史
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认清理这条配置的请求历史？</AlertDialogTitle>
                            <AlertDialogDescription>
                              将清理配置「{item.name}」在 `check_history` 里的全部请求历史。
                              这不会删除配置本身，但历史记录不可恢复。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <form id={`clear-config-history-${item.id}`} action={clearConfigHistoryAction}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="return_to" value={returnPath} />
                          </form>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              type="submit"
                              form={`clear-config-history-${item.id}`}
                              variant="destructive"
                            >
                              确认清理
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
      <Sheet open={isReplaceModelOpen && hasSelection} onOpenChange={setIsReplaceModelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>批量更换引用模型</SheetTitle>
            <SheetDescription>
              {hasSelection
                ? `当前选中 ${visibleSelectedIds.length} 条配置。只允许同一 Provider 类型一起替换。`
                : "先在列表里勾选配置，再批量更换模型。"}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 px-6">
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              <div>已选配置：{visibleSelectedIds.length}</div>
              <div>
                Provider：
                {selectedProviderType ? (
                  <span className="font-medium text-foreground">{selectedProviderType}</span>
                ) : hasSelection ? (
                  <span className="font-medium text-destructive">包含多个类型，不能批量替换</span>
                ) : (
                  <span>未选择</span>
                )}
              </div>
            </div>
            <label className="space-y-2">
              <span className="text-sm font-medium">目标模型</span>
              <select
                name="target_model_id"
                form={formId}
                value={resolvedTargetModelId}
                onChange={(event) => setTargetModelId(event.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
                disabled={!selectedProviderType || filteredModels.length === 0}
                required
              >
                {filteredModels.length === 0 ? (
                  <option value="">
                    {selectedProviderType ? "当前类型下没有可选模型" : "请先选择同类型配置"}
                  </option>
                ) : null}
                {filteredModels.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.model}
                    {item.template_name ? ` · ${item.template_name}` : ""}
                  </option>
                ))}
              </select>
            </label>
            {hasMixedTypes ? (
              <p className="text-sm text-destructive">
                当前选中的配置包含多个 Provider 类型。请先筛选或分批选择后再更换模型。
              </p>
            ) : null}
          </div>
          <SheetFooter>
            {visibleSelectedIds.map((id) => (
              <input key={id} type="hidden" name="ids" value={id} form={formId} />
            ))}
            {selectedProviderType ? (
              <input type="hidden" name="selected_types" value={selectedProviderType} form={formId} />
            ) : null}
            <Button
              type="submit"
              name="operation"
              value="replace_model"
              form={formId}
              disabled={!hasSelection || hasMixedTypes || !resolvedTargetModelId}
            >
              确认替换
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsReplaceModelOpen(false)}>
              取消
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </form>
  )
}
