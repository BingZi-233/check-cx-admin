"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { GithubIcon, LoaderCircleIcon, LogInIcon } from "lucide-react"

import { getOAuthProviders } from "@/lib/admin/env"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

function providerLabel(provider: string) {
  switch (provider) {
    case "google":
      return "Google"
    case "github":
      return "GitHub"
    case "apple":
      return "Apple"
    default:
      return provider
  }
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "github") {
    return <GithubIcon className="size-4" />
  }

  return <LogInIcon className="size-4" />
}

export function LoginForm({
  className,
  errorMessage,
  publicEnvReady,
  ...props
}: React.ComponentProps<"div"> & {
  errorMessage?: string
  publicEnvReady: boolean
}) {
  const router = useRouter()
  const supabase = useMemo(() => {
    if (!publicEnvReady) {
      return null
    }

    return createClient()
  }, [publicEnvReady])
  const providers = useMemo(() => getOAuthProviders(), [])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState(errorMessage ?? "")
  const [isOAuthPending, startOAuthTransition] = useTransition()
  const [isPasswordPending, startPasswordTransition] = useTransition()

  const isPending = isOAuthPending || isPasswordPending

  const handleOAuthLogin = (provider: string) => {
    if (!supabase) {
      setMessage("Supabase 环境变量未配置，无法发起 OAuth 登录")
      return
    }

    setMessage("")

    startOAuthTransition(async () => {
      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as "google" | "github" | "apple",
        options: {
          redirectTo,
        },
      })

      if (error) {
        setMessage(error.message)
        return
      }

      if (data.url) {
        window.location.assign(data.url)
      }
    })
  }

  const handlePasswordLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      setMessage("Supabase 环境变量未配置，无法进行密码登录")
      return
    }

    setMessage("")

    startPasswordTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
        return
      }

      router.replace("/dashboard")
      router.refresh()
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">登录后台</CardTitle>
          <CardDescription>
            优先使用 OAuth，密码登录保留给初始化和兜底。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordLogin}>
            <FieldGroup>
              <Field>
                {providers.map((provider) => (
                  <Button
                    key={provider}
                    variant="outline"
                    type="button"
                    disabled={isPending || !publicEnvReady}
                    onClick={() => handleOAuthLogin(provider)}
                  >
                    <ProviderIcon provider={provider} />
                    使用 {providerLabel(provider)} 登录
                  </Button>
                ))}
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                或使用邮箱密码
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">邮箱</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">密码</FieldLabel>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </Field>
              {message ? (
                <FieldDescription className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive">
                  {message}
                </FieldDescription>
              ) : null}
              <Field>
                <Button type="submit" disabled={isPending || !publicEnvReady}>
                  {isPending ? (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  ) : null}
                  登录
                </Button>
                <FieldDescription className="text-center">
                  登录成功后会自动跳转到管理控制台。
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        后台默认允许任意登录用户访问；如需收紧权限，请设置 `ADMIN_EMAILS`。
      </FieldDescription>
    </div>
  )
}
