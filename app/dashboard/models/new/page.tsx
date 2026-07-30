import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { ModelForm } from "@/components/admin/forms/model-form"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireAdminUser } from "@/lib/admin/auth"
import { listTemplates } from "@/lib/admin/queries"
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function NewModelPage() {
  await requireAdminUser()

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="新建模型"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  const templates = await listTemplates()

  return (
    <div className="space-y-4">
      <PageHeader
        title="新建模型"
        description="模型负责维护模型名和模板绑定，实例连接信息请在配置页管理。"
        actions={
          <Button variant="outline" render={<Link href="/dashboard/models" />}>
            <ArrowLeftIcon />
            返回列表
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>模型表单</CardTitle>
          <CardDescription>
            模板是默认请求参数的唯一来源，模型只负责关联它。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModelForm templates={templates} />
        </CardContent>
      </Card>
    </div>
  )
}
