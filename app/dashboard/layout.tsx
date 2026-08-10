export const dynamic = "force-dynamic"

import { ReactNode } from "react"

import { EnvInfoPopover } from "@/components/admin/env-info-popover"
import { Notice } from "@/components/admin/notice"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { requireAppUser } from "@/lib/admin/auth"
import { describeUserScope, isAdminUser } from "@/lib/admin/permissions"
import {
  getAdminDatabaseSchema,
  getAdminDatabaseWarnings,
  hasAdminDatabaseEnv,
} from "@/lib/admin/server-env"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requireAppUser()
  const adminDbReady = hasAdminDatabaseEnv()
  const adminDbWarnings = getAdminDatabaseWarnings()
  const dbSchema = adminDbReady ? getAdminDatabaseSchema() : null

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: user.displayName,
          email: user.email,
          avatar: user.avatarUrl,
          role: user.role,
          groupName: user.groupName,
        }}
      />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">check-cx 后台管理</p>
              <p className="truncate text-[0.6875rem] text-muted-foreground">
                {user.email} · {describeUserScope(user)}
              </p>
            </div>
            {/* 以前这里平铺三个 Badge 加一个外链，挤成一团；
                现在只留角色标识，其余信息收进「环境」气泡 */}
            <div className="flex shrink-0 items-center gap-1.5">
              <Badge variant={isAdminUser(user) ? "default" : "outline"}>
                {isAdminUser(user) ? "管理员" : "成员"}
              </Badge>
              <EnvInfoPopover adminDbReady={adminDbReady} dbSchema={dbSchema} />
              <ThemeToggle />
            </div>
          </div>
        </header>
        {/* 原来这里包了一层 PageTransition，每次导航强制 300ms 淡入 + 位移，
            叠在本来就慢的 server render 之后，只会让人觉得更卡。
            现在改用 loading.tsx 骨架屏 + 侧边栏 pending 图标做反馈。 */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {!adminDbReady ? (
            <Notice
              variant="warning"
              title="后台数据库能力未启用"
              description={adminDbWarnings.join("；")}
            />
          ) : null}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
