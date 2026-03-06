export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { ShieldCheckIcon } from "lucide-react"

import { Notice } from "@/components/admin/notice"
import { LoginForm } from "@/components/login-form"
import { getOptionalAdminUser } from "@/lib/admin/auth"
import { getPublicEnvWarnings, hasPublicSupabaseEnv } from "@/lib/admin/env"

function resolveErrorMessage(code?: string) {
  switch (code) {
    case "forbidden":
      return "这个账号不在 ADMIN_EMAILS 白名单里。"
    case "oauth":
      return "OAuth 回调失败，请检查 Supabase 提供商配置。"
    case "missing-env":
      return "Supabase 环境变量未配置，登录流程无法启动。"
    default:
      return undefined
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await getOptionalAdminUser()

  if (user) {
    redirect("/dashboard")
  }

  const params = await searchParams
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error
  const publicEnvReady = hasPublicSupabaseEnv()
  const envWarnings = getPublicEnvWarnings()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheckIcon className="size-4" />
          </div>
          check-cx Admin
        </div>
        {!publicEnvReady ? (
          <Notice
            variant="warning"
            title="先把环境变量配好"
            description={envWarnings.join("；")}
          />
        ) : null}
        <LoginForm
          publicEnvReady={publicEnvReady}
          errorMessage={resolveErrorMessage(errorCode)}
        />
      </div>
    </div>
  )
}
