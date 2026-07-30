"use client"

import { useTheme } from "next-themes"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const options = [
  { value: "light", label: "浅色", icon: SunIcon },
  { value: "dark", label: "深色", icon: MoonIcon },
  { value: "system", label: "跟随系统", icon: MonitorIcon },
] as const

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  // next-themes 在挂载完成前 resolvedTheme 是 undefined，
  // 服务端和客户端首帧都会走到 SunIcon，所以不会有 hydration 不一致。
  const Icon = resolvedTheme === "dark" ? MoonIcon : SunIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="切换主题" />}
      >
        <Icon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        {options.map((option) => {
          const OptionIcon = option.icon

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={theme === option.value ? "bg-accent" : undefined}
            >
              <OptionIcon />
              {option.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
