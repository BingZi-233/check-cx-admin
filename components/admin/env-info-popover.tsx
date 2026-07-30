"use client"

import Link from "next/link"
import { ExternalLinkIcon, InfoIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

/** 数据库连通状态、schema、上游仓库链接原来平铺在 header 里，这里收进一个气泡 */
export function EnvInfoPopover({
  adminDbReady,
  dbSchema,
}: {
  adminDbReady: boolean
  dbSchema: string | null
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="环境信息" />}
      >
        {adminDbReady ? (
          <InfoIcon />
        ) : (
          <InfoIcon className="text-destructive" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="gap-2.5">
        <PopoverHeader>
          <PopoverTitle>环境信息</PopoverTitle>
          <PopoverDescription>
            这些值来自服务端运行时环境变量。
          </PopoverDescription>
        </PopoverHeader>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">后台数据库</span>
          <Badge variant={adminDbReady ? "secondary" : "destructive"}>
            {adminDbReady ? "已连通" : "缺少权限"}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">数据库 schema</span>
          <Badge variant={dbSchema === "public" ? "outline" : "secondary"}>
            {dbSchema ?? "未知"}
          </Badge>
        </div>
        <Separator />
        <Link
          href="https://github.com/BingZi-233/check-cx"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          上游仓库 check-cx
          <ExternalLinkIcon className="size-3" />
        </Link>
      </PopoverContent>
    </Popover>
  )
}
