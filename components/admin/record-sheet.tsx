"use client"

import { useState } from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type RecordSheetProps = {
  trigger: React.ReactElement
  title: string
  description?: React.ReactNode
  /** 拿到 close 回调，把它接到表单的 onSuccess / 取消按钮上 */
  children: (close: () => void) => React.ReactNode
  side?: "right" | "left" | "bottom" | "top"
  className?: string
}

/**
 * 列表页就地编辑用的 Sheet 壳。表单完全渲染在 Sheet 内部，
 * 不像旧代码那样靠 form={id} 跨 portal 关联外层表单。
 */
export function RecordSheet({
  trigger,
  title,
  description,
  children,
  side = "right",
  className,
}: RecordSheetProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent
        side={side}
        className={className ?? "w-full gap-0 sm:max-w-xl"}
      >
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">{open ? children(close) : null}</div>
      </SheetContent>
    </Sheet>
  )
}
