import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { ProtectedNav } from "@/components/protected/protected-nav"
import { ProtectedTopbar } from "@/components/protected/protected-topbar"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    redirect("/auth/login")
  }

  const claims = data.claims as Record<string, unknown>
  const email = typeof claims.email === "string" ? claims.email : ""
  const userMetadata =
    typeof claims.user_metadata === "object" && claims.user_metadata
      ? (claims.user_metadata as Record<string, unknown>)
      : null
  const avatarUrl =
    (typeof userMetadata?.avatar_url === "string" && userMetadata.avatar_url) ||
    null

  return (
    <div className="flex min-h-svh w-full">
      <aside className="bg-sidebar hidden w-64 shrink-0 border-r md:flex md:flex-col">
        <div className="flex-1 p-2 pt-4">
          <ProtectedNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <ProtectedTopbar email={email} avatarUrl={avatarUrl} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

