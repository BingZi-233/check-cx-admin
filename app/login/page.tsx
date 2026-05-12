export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { ShieldCheckIcon } from "lucide-react"

import { Notice } from "@/components/admin/notice"
import { LoginForm } from "@/components/login-form"
import { getOptionalAppUser } from "@/lib/admin/auth"
import { getOAuthProviders, getSupabaseAuthWarnings, hasSupabaseAuthEnv } from "@/lib/admin/env"

function resolveErrorMessage(code?: string) {
  switch (code) {
    case "forbidden":
      return "这个 GitHub 账号不在允许名单里，或者登录邮箱和后台登记的 GitHub 邮箱不一致。"
    case "oauth":
      return "GitHub OAuth 回调失败，请检查 Supabase GitHub 提供商配置。"
    case "missing-env":
      return "Supabase 环境变量未配置，登录流程无法启动。"
    case "provider":
      return "当前后台只允许 GitHub 登录。"
    default:
      return undefined
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await getOptionalAppUser()

  if (user) {
    redirect("/dashboard")
  }

  const params = await searchParams
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error
  const authEnvReady = hasSupabaseAuthEnv()
  const envWarnings = getSupabaseAuthWarnings()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheckIcon className="size-4" />
          </div>
          check-cx Admin
        </div>
        {!authEnvReady ? (
          <Notice
            variant="warning"
            title="先把环境变量配好"
            description={envWarnings.join("；")}
          />
        ) : null}
        <LoginForm
          authEnvReady={authEnvReady}
          errorMessage={resolveErrorMessage(errorCode)}
          providers={getOAuthProviders()}
          nextPath="/dashboard"
        />
      </div>
    </div>
  )
}
