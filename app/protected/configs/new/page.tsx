import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Page() {
  return (
    <div className="min-h-svh w-full p-6 md:p-10">
      <div className="mx-auto w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">新增配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">这里是“新增配置”页面占位符（避免快捷操作跳 404）。</p>
            <Button asChild variant="outline">
              <Link href="/protected">返回仪表盘</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

