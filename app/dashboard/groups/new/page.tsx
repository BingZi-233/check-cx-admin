import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { GroupForm } from "@/components/admin/forms/group-form"
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

export default async function NewGroupPage() {
  await requireAdminUser()

  if (!hasAdminDatabaseEnv()) {
    return (
      <PageHeader
        title="新增分组"
        description="缺少 service role 凭据，当前页面暂不可用。"
      />
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="新增分组"
        description="分组和配置之间是文本关联而不是外键，命名尽量一次定好。"
        actions={
          <Button variant="outline" render={<Link href="/dashboard/groups" />}>
            <ArrowLeftIcon />
            返回列表
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>分组信息</CardTitle>
          <CardDescription>标签使用英文逗号分隔。</CardDescription>
        </CardHeader>
        <CardContent>
          <GroupForm />
        </CardContent>
      </Card>
    </div>
  )
}
