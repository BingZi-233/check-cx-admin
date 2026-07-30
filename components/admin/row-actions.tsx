"use client"

import { MoreHorizontalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type RowActionItem = {
  key: string
  label: React.ReactNode
  icon?: React.ReactNode
  onSelect: () => void
  variant?: "default" | "destructive"
  disabled?: boolean
  /** 上方加一条分隔线 */
  separatorBefore?: boolean
}

/**
 * 行操作收进一个 … 菜单，取代以前平铺的「编辑 / 删除」两颗按钮。
 * 菜单项只负责改状态，弹窗和 Sheet 由调用方以受控方式渲染在菜单外面，
 * 这样菜单收起时不会把弹窗一起卸载。
 */
export function RowActions({ items }: { items: RowActionItem[] }) {
  const visibleItems = items.filter(Boolean)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="行操作" />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {visibleItems.map((item) => (
          <div key={item.key}>
            {item.separatorBefore ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              variant={item.variant}
              disabled={item.disabled}
              onClick={item.onSelect}
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
