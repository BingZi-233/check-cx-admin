import Link from "next/link"
import { FileQuestionIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function DashboardNotFound() {
  return (
    <Empty className="border py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestionIcon />
        </EmptyMedia>
        <EmptyTitle>找不到这条记录</EmptyTitle>
        <EmptyDescription>
          它可能已经被删除了，或者你没有权限访问它。
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link href="/dashboard" />}>回到概览</Button>
      </EmptyContent>
    </Empty>
  )
}
