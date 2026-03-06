"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BellIcon,
  FolderTreeIcon,
  GaugeIcon,
  HistoryIcon,
  LayoutTemplateIcon,
  ServerCogIcon,
  TerminalIcon,
  WaypointsIcon,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const mainItems = [
  { title: "概览", url: "/dashboard", icon: GaugeIcon },
  { title: "Provider 配置", url: "/dashboard/configs", icon: ServerCogIcon },
  { title: "请求模板", url: "/dashboard/templates", icon: LayoutTemplateIcon },
  { title: "分组信息", url: "/dashboard/groups", icon: FolderTreeIcon },
  { title: "系统通知", url: "/dashboard/notifications", icon: BellIcon },
  { title: "历史记录", url: "/dashboard/history", icon: HistoryIcon },
  { title: "运行状态", url: "/dashboard/system", icon: WaypointsIcon },
]

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
    avatar?: string | null
  }
}) {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <TerminalIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">check-cx-admin</span>
                <span className="truncate text-xs">Supabase + Next.js</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>管理台</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                const isActive =
                  item.url === "/dashboard"
                    ? pathname === item.url
                    : pathname.startsWith(item.url)
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={item.url} />}
                    >
                      <Icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
