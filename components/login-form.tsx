import { GithubIcon, LogInIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
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
  authEnvReady,
  providers,
  nextPath,
  ...props
}: React.ComponentProps<"div"> & {
  errorMessage?: string
  authEnvReady: boolean
  providers: string[]
  nextPath: string
}) {
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
          <form action="/auth/sign-in/password" method="post">
            <input type="hidden" name="next" value={nextPath} />
            <FieldGroup>
              <Field>
                {providers.map((provider) => {
                  const href = `/auth/sign-in?provider=${encodeURIComponent(provider)}&next=${encodeURIComponent(nextPath)}`

                  if (!authEnvReady) {
                    return (
                      <Button key={provider} variant="outline" type="button" disabled>
                        <ProviderIcon provider={provider} />
                        使用 {providerLabel(provider)} 登录
                      </Button>
                    )
                  }

                  return (
                    <a key={provider} href={href} className={buttonVariants({ variant: "outline" })}>
                      <ProviderIcon provider={provider} />
                      使用 {providerLabel(provider)} 登录
                    </a>
                  )
                })}
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                或使用邮箱密码
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">邮箱</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">密码</FieldLabel>
                </div>
                <Input id="password" name="password" type="password" required />
              </Field>
              {errorMessage ? (
                <FieldDescription className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive">
                  {errorMessage}
                </FieldDescription>
              ) : null}
              <Field>
                <Button type="submit" disabled={!authEnvReady}>
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
