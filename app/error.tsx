"use client"

import { useEffect } from "react"

export default function RootError({
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
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-lg font-semibold">出错了</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "应用遇到了一个未预期的错误。"}
      </p>
      <button
        type="button"
        onClick={reset}
        className="h-7 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
      >
        重试
      </button>
    </div>
  )
}
