"use client"

import { useLinkStatus } from "next/link"
import type { LucideIcon } from "lucide-react"

import { Spinner } from "@/components/ui/spinner"

/**
 * 必须渲染在 <Link> 内部才能拿到 useLinkStatus。
 * 导航等待期间把图标换成 spinner，点击后立刻有反馈，而不是干等白屏。
 */
export function NavLinkIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { pending } = useLinkStatus()

  return pending ? <Spinner className="size-4" /> : <Icon />
}
