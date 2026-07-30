import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { TemplateForm } from "@/components/admin/forms/template-form"
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
import { hasAdminDatabaseEnv } from "@/lib/admin/server-env"

export default async function NewTemplatePage() {
  await requireAdminUser()

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="新建模板"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="新建模板"
        description="模板用于复用请求头和 metadata，减少在每条配置里重复填写。"
        actions={
          <Button variant="outline" render={<Link href="/dashboard/templates" />}>
            <ArrowLeftIcon />
            返回列表
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>模板表单</CardTitle>
          <CardDescription>请求头和 metadata 都是可选 JSON。</CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateForm />
        </CardContent>
      </Card>
    </div>
  )
}
