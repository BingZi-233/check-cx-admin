export const dynamic = "force-dynamic"

import { ReactNode } from "react"
import Link from "next/link"
import { ExternalLinkIcon } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { Notice } from "@/components/admin/notice"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { requireAdminUser } from "@/lib/admin/auth"
import { getAdminDatabaseWarnings, hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requireAdminUser()
  const adminDbReady = hasAdminDatabaseEnv()
  const adminDbWarnings = getAdminDatabaseWarnings()

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: user.displayName,
          email: user.email,
          avatar: user.avatarUrl,
        }}
      />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">check-cx 后台管理</p>
              <p className="truncate text-xs text-muted-foreground">
                当前登录：{user.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={adminDbReady ? "secondary" : "destructive"}>
                {adminDbReady ? "数据库已连通" : "缺少后台数据库权限"}
              </Badge>
              <Link
                href="https://github.com/BingZi-233/check-cx"
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                上游仓库
                <ExternalLinkIcon className="size-3" />
              </Link>
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
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
