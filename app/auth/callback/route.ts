import { NextResponse } from "next/server"

import { sanitizeRedirectPath } from "@/lib/admin/env"
import { isAllowedAdminEmail } from "@/lib/admin/server-env"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const next = sanitizeRedirectPath(url.searchParams.get("next"))

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth", url.origin))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth", url.origin))
  }

  if (!isAllowedAdminEmail(data.user?.email)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL("/login?error=forbidden", url.origin))
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
