"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  FolderOpen,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

const navItems: NavItem[] = [
  {
    title: "仪表盘",
    href: "/protected",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "检测配置",
    href: "/protected/configs",
    icon: Settings,
  },
  {
    title: "分组管理",
    href: "/protected/groups",
    icon: FolderOpen,
  },
  {
    title: "系统通知",
    href: "/protected/notifications",
    icon: Bell,
  },
]

export function ProtectedNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive && "bg-accent text-accent-foreground"
            )}
          >
            <Icon className="size-4" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </div>
  )
}
