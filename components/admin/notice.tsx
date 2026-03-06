import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const variants = {
  info: {
    icon: InfoIcon,
    className: "border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-300",
  },
  warning: {
    icon: AlertTriangleIcon,
    className:
      "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300",
  },
  success: {
    icon: CheckCircle2Icon,
    className:
      "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  },
} as const

export function Notice({
  title,
  description,
  variant = "info",
  className,
}: {
  title: string
  description: string
  variant?: keyof typeof variants
  className?: string
}) {
  const Icon = variants[variant].icon

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        variants[variant].className,
        className
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-current/80">{description}</p>
      </div>
    </div>
  )
}
