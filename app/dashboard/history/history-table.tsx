"use client"

import { useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { HistoryStatusBadge, ProviderBadge } from "@/components/admin/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { formatDateTime } from "@/lib/admin/format"
import type { CheckHistoryRecord, HistoryStatus } from "@/lib/admin/types"
import { cn } from "@/lib/utils"

const ALL = "__all__"

const statusItems: Record<string, string> = {
  [ALL]: "全部状态",
  operational: "正常",
  degraded: "降级",
  failed: "失败",
  validation_failed: "校验失败",
  error: "错误",
}

type HistoryTableProps = {
  rows: CheckHistoryRecord[]
  total: number
  page: number
  pageSize: number
  status: HistoryStatus | null
  configOptions: Array<{ id: string; name: string }>
  configId: string | null
  showGroupColumn: boolean
}

/**
 * 服务端分页 + 筛选，条件写进 URL，可分享可后退。
 * 翻页期间用 useTransition 保持旧数据在屏并显示 spinner，不闪空白。
 */
export function HistoryTable({
  rows,
  total,
  page,
  pageSize,
  status,
  configOptions,
  configId,
  showGroupColumn,
}: HistoryTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // startTransition 会让旧数据留在屏上直到新页面就绪，不需要自己再镜像一份行数据
  const [isPending, startTransition] = useTransition()

  function pushQuery(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString())

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value.length === 0) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }

    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    })
  }

  const configItems: Record<string, string> = {
    [ALL]: "全部配置",
    ...Object.fromEntries(configOptions.map((item) => [item.id, item.name])),
  }

  const columns: DataTableColumn<CheckHistoryRecord>[] = [
    {
      id: "checked_at",
      header: "检测时间",
      width: "13%",
      cell: (row) => (
        <span className="text-muted-foreground">{formatDateTime(row.checked_at)}</span>
      ),
    },
    {
      id: "config",
      header: "配置",
      width: "18%",
      cell: (row) => (
        <div className="truncate font-medium" title={row.check_configs?.name ?? row.config_id}>
          {row.check_configs?.name ?? row.config_id}
        </div>
      ),
    },
    {
      id: "type",
      header: "类型",
      width: "8%",
      cell: (row) =>
        row.check_configs?.type ? (
          <ProviderBadge type={row.check_configs.type} />
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      id: "status",
      header: "状态",
      width: "9%",
      cell: (row) => <HistoryStatusBadge status={row.status} />,
    },
    {
      id: "latency",
      header: "延迟",
      width: "8%",
      align: "right",
      cell: (row) => <Badge variant="outline">{row.latency_ms ?? "-"} ms</Badge>,
    },
    {
      id: "ping",
      header: "Ping",
      width: "8%",
      align: "right",
      cell: (row) => <Badge variant="outline">{row.ping_latency_ms ?? "-"} ms</Badge>,
    },
    ...(showGroupColumn
      ? [
          {
            id: "group",
            header: "分组",
            width: "9%",
            cell: (row: CheckHistoryRecord) => (
              <span className="text-muted-foreground">
                {row.check_configs?.group_name ?? "-"}
              </span>
            ),
          },
        ]
      : []),
    {
      id: "message",
      header: "消息",
      className: "max-w-[280px] whitespace-normal",
      cell: (row) => (
        <span className="line-clamp-2 text-muted-foreground">{row.message ?? "-"}</span>
      ),
    },
  ]

  return (
    <div className={cn("space-y-3", isPending && "opacity-70 transition-opacity")}>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          items={statusItems}
          value={status ?? ALL}
          onValueChange={(next) =>
            pushQuery({ status: next === ALL ? null : String(next), page: null })
          }
        >
          <SelectTrigger className="min-w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={configItems}
          value={configId ?? ALL}
          onValueChange={(next) =>
            pushQuery({ config: next === ALL ? null : String(next), page: null })
          }
        >
          <SelectTrigger className="min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>全部配置</SelectItem>
            {configOptions.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {status || configId ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => pushQuery({ status: null, config: null, page: null })}
          >
            清空筛选
          </Button>
        ) : null}
        {isPending ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Spinner className="size-3" />
            加载中
          </span>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => String(row.id)}
        minWidth="min-w-[1020px]"
        emptyTitle={status || configId ? "没有匹配的检测记录" : "还没有检测记录"}
        emptyDescription={
          status || configId
            ? "换个筛选条件再试。"
            : "轮询节点跑起来之后这里会有数据。"
        }
        pagination={{
          page,
          pageCount: Math.max(1, Math.ceil(total / pageSize)),
          total,
          pageSize,
          onPageChange: (next) => pushQuery({ page: String(next) }),
        }}
      />
    </div>
  )
}
