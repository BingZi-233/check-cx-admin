import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { normalizeUiErrorMessage } from '@/lib/locale'

export default async function Page({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">抱歉，出现了一点问题。</CardTitle>
            </CardHeader>
            <CardContent>
              {params?.error ? (
                <p className="text-sm text-muted-foreground">
                  错误信息：{normalizeUiErrorMessage(params.error, '登录失败')}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">发生未知错误。</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
