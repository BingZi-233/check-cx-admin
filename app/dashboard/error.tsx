"use client"

import { useEffect } from "react"
import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Empty className="border py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertTriangleIcon />
        </EmptyMedia>
        <EmptyTitle>这个页面加载失败了</EmptyTitle>
        <EmptyDescription>
          {error.message || "服务端返回了一个未预期的错误。"}
          {error.digest ? (
            <span className="mt-1 block font-mono text-[0.6875rem]">
              digest: {error.digest}
            </span>
          ) : null}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" onClick={reset}>
          <RotateCcwIcon />
          重试
        </Button>
      </EmptyContent>
    </Empty>
  )
}
