import { GithubIcon, LogInIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
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
} from "@/components/ui/field"

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
            只接受允许名单中的 GitHub 邮箱登录。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
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
              <Field>
                <FieldLabel>登录要求</FieldLabel>
                <FieldDescription className="text-center">
                  先把对方的 GitHub 登录邮箱写进允许名单，首次登录后会自动绑定账号并跳转到控制台。
                </FieldDescription>
              </Field>
              {errorMessage ? (
                <FieldDescription className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive">
                  {errorMessage}
                </FieldDescription>
              ) : null}
            </FieldGroup>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        后台只允许允许名单中的 GitHub 用户登录；`ADMIN_EMAILS` 只建议保留给 bootstrap 管理员兜底。
      </FieldDescription>
    </div>
  )
}
