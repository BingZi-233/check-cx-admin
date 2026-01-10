"use client"

import Link from "next/link"
import { useState } from "react"
import { LogOut, Menu } from "lucide-react"

import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ProtectedNav } from "@/components/protected/protected-nav"
import { UserMenu } from "@/components/protected/user-menu"
import { ThemeToggle } from "@/components/theme/theme-toggle"

export function ProtectedTopbar({
  email,
  avatarUrl,
}: {
  email: string
  avatarUrl?: string | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-14 items-center gap-2 border-b px-4 backdrop-blur md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="size-5" />
            <span className="sr-only">打开导航</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-14 items-center border-b px-4">
            <Link
              href="/protected"
              className="text-sm font-semibold"
              onClick={() => setOpen(false)}
            >
              check-cx
            </Link>
          </div>
          <div className="p-2">
            <ProtectedNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/protected" className="text-sm font-semibold">
        check-cx
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu email={email} avatarUrl={avatarUrl} />
        <LogoutButton variant="ghost" size="icon" aria-label="登出">
          <LogOut className="size-4" />
          <span className="sr-only">登出</span>
        </LogoutButton>
      </div>
    </header>
  )
}
