"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserMenu({
  email,
  avatarUrl,
}: {
  email: string
  avatarUrl?: string | null
}) {
  const router = useRouter()

  const fallback = useMemo(() => {
    const first = email?.trim()?.[0]
    return first ? first.toUpperCase() : "用"
  }, [email])

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="size-8">
            <AvatarImage src={avatarUrl ?? undefined} alt={email || "用户"} />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-48 truncate text-sm md:inline">
            {email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">已登录</p>
            <p className="text-muted-foreground truncate text-xs">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            void logout()
          }}
        >
          <LogOut className="size-4" />
          <span>登出</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
